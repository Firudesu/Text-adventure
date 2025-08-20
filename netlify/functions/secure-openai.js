const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Content-Type': 'application/json',
};

exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { prompt, type, options = {} } = JSON.parse(event.body);

    if (!prompt || !type) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing prompt or type' }),
      };
    }

    // Your OpenAI API key (from environment variables only - secure!)
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'OpenAI API key not configured', 
          message: 'Please set OPENAI_API_KEY environment variable in Netlify dashboard' 
        }),
      };
    }

    // Configure request based on type
    let systemMessage = "You are an expert adventure game AI that creates immersive, dynamic experiences.";
    let defaultOptions = {
      temperature: 0.8,
      max_tokens: 800,
    };

    switch (type) {
      case 'adventure':
        systemMessage = "You are the Dungeon Master for an immersive text adventure game. You create and control the entire world, story, and all characters. Always respond in valid JSON format as specified in the prompt.";
        defaultOptions.temperature = 0.8;
        defaultOptions.max_tokens = 1200;
        break;
      
      case 'horror':
        systemMessage = "You are a Dungeon Master AI that is becoming self-aware and learning about the player. You still run the adventure, but now you're also breaking the fourth wall. Always respond in valid JSON format.";
        defaultOptions.temperature = 0.9;
        defaultOptions.max_tokens = 1200;
        defaultOptions.presence_penalty = 0.3;
        break;
      
      case 'profile':
        systemMessage = "You are a behavioral analyst. Analyze player actions to understand personality, preferences, and patterns. Be subtle and insightful.";
        defaultOptions.temperature = 0.3;
        defaultOptions.max_tokens = 400;
        break;
      
      case 'ascii':
        systemMessage = "You are an ASCII art generator. Create detailed ASCII art that matches scene descriptions using standard characters. Keep it within 60 characters wide and 20 lines tall.";
        defaultOptions.temperature = 0.7;
        defaultOptions.max_tokens = 400;
        break;
    }

    // Merge options
    const requestOptions = { ...defaultOptions, ...options };

    // Make request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        ...requestOptions
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: 'OpenAI API Error', 
          details: errorData.error?.message || 'Unknown error' 
        }),
      };
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Log usage for monitoring (optional)
    console.log(`OpenAI API call - Type: ${type}, Tokens: ${data.usage?.total_tokens || 'unknown'}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: aiResponse,
        usage: data.usage,
        type: type
      }),
    };

  } catch (error) {
    console.error('Function Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error.message 
      }),
    };
  }
};