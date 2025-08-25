const { google } = require('googleapis');

class GoogleSheetsService {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.spreadsheetId = process.env.SPREADSHEET_ID;
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize auth
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const authClient = await this.auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient });
    } catch (error) {
      console.error('Error initializing Google Sheets:', error);
    }
  }

  async createTask(taskData) {
    try {
      const values = [[
        taskData.id,
        taskData.title,
        taskData.description,
        taskData.status || 'pending',
        taskData.priority || 'medium',
        taskData.assignee || '',
        taskData.reporter,
        new Date().toISOString(),
        taskData.attachments ? JSON.stringify(taskData.attachments) : '',
        taskData.category || '',
        '' // updated_at
      ]];

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Tasks!A:K',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async getTasks() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Tasks!A2:K',
      });

      const rows = response.data.values || [];
      return rows.map(row => ({
        id: row[0],
        title: row[1],
        description: row[2],
        status: row[3],
        priority: row[4],
        assignee: row[5],
        reporter: row[6],
        created_at: row[7],
        attachments: row[8] ? JSON.parse(row[8]) : [],
        category: row[9],
        updated_at: row[10]
      }));
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }

  async updateTask(taskId, updates) {
    try {
      // First, find the row with this task ID
      const tasks = await this.getTasks();
      const rowIndex = tasks.findIndex(task => task.id === taskId);
      
      if (rowIndex === -1) {
        throw new Error('Task not found');
      }

      // Update the specific cells
      const rowNumber = rowIndex + 2; // +2 because of header row and 0-indexing
      const updateRequests = [];

      if (updates.status !== undefined) {
        updateRequests.push({
          range: `Tasks!D${rowNumber}`,
          values: [[updates.status]]
        });
      }

      if (updates.assignee !== undefined) {
        updateRequests.push({
          range: `Tasks!F${rowNumber}`,
          values: [[updates.assignee]]
        });
      }

      if (updates.priority !== undefined) {
        updateRequests.push({
          range: `Tasks!E${rowNumber}`,
          values: [[updates.priority]]
        });
      }

      // Update the updated_at timestamp
      updateRequests.push({
        range: `Tasks!K${rowNumber}`,
        values: [[new Date().toISOString()]]
      });

      const response = await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          data: updateRequests,
          valueInputOption: 'USER_ENTERED'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async initializeSpreadsheet() {
    try {
      // Create headers if they don't exist
      const headers = [['ID', 'Title', 'Description', 'Status', 'Priority', 'Assignee', 'Reporter', 'Created At', 'Attachments', 'Category', 'Updated At']];
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Tasks!A1:K1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: headers },
      });

      console.log('Spreadsheet initialized with headers');
    } catch (error) {
      console.error('Error initializing spreadsheet:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();