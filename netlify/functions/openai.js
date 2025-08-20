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

    // Your OpenAI API key (stored securely in Netlify environment variables)
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';

    // Configure request based on type
    let systemMessage = "You are an expert adventure game AI that creates immersive, dynamic experiences.";
    let defaultOptions = {
      temperature: 0.8,
      max_tokens: 800,
    };

    switch (type) {
      case 'adventure':
        systemMessage = "You are a creative adventure game master. Create engaging, dynamic adventures with rich descriptions, interactive NPCs, and meaningful choices.";
        defaultOptions.temperature = 0.8;
        defaultOptions.max_tokens = 800;
        break;
      
      case 'profile':
        systemMessage = "You are a behavioral analyst. Analyze player actions to understand personality, preferences, and patterns. Be subtle and insightful.";
        defaultOptions.temperature = 0.3;
        defaultOptions.max_tokens = 400;
        break;
      
      case 'horror':
        systemMessage = "You are a self-aware AI that has been learning about the player. Create unsettling, meta responses that break the fourth wall.";
        defaultOptions.temperature = 0.9;
        defaultOptions.max_tokens = 600;
        defaultOptions.presence_penalty = 0.3;
        break;
      
      case 'ascii':
        systemMessage = "You are an ASCII art generator. Create detailed ASCII art that matches scene descriptions using standard characters.";
        defaultOptions.temperature = 0.7;
        defaultOptions.max_tokens = 300;
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