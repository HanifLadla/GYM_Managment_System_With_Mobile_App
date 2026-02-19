import axios from 'axios';

const BASE_URL = 'http://192.168.1.105:5000/api'; // Replace with your backend IP

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
    });
  }

  setAuthToken(token) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  // Auth
  async login(email, password) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // Dashboard
  async getDashboardStats() {
    const response = await this.api.get('/dashboard/stats');
    return response.data;
  }

  // Members
  async getMembers(params = {}) {
    const response = await this.api.get('/members', { params });
    return response.data;
  }

  async getMember(id) {
    const response = await this.api.get(`/members/${id}`);
    return response.data;
  }

  async createMember(memberData) {
    const response = await this.api.post('/members', memberData);
    return response.data;
  }

  // Attendance
  async getTodayAttendance() {
    const response = await this.api.get('/attendance/today');
    return response.data;
  }

  async checkIn(cardId) {
    const response = await this.api.post(`/attendance/checkin/${cardId}`);
    return response.data;
  }

  async checkOut(attendanceId) {
    const response = await this.api.post(`/attendance/checkout/${attendanceId}`);
    return response.data;
  }

  // Payments
  async getPayments(params = {}) {
    const response = await this.api.get('/payments', { params });
    return response.data;
  }

  async createPayment(paymentData) {
    const response = await this.api.post('/payments', paymentData);
    return response.data;
  }

  // Reports
  async getReports(type, params = {}) {
    const response = await this.api.get(`/reports/${type}`, { params });
    return response.data;
  }

  // Trainers
  async getTrainers() {
    const response = await this.api.get('/trainers');
    return response.data;
  }

  // Classes
  async getClasses() {
    const response = await this.api.get('/classes');
    return response.data;
  }

  // Equipment
  async getEquipment() {
    const response = await this.api.get('/equipment');
    return response.data;
  }

  // Plans
  async getPlans() {
    const response = await this.api.get('/plans');
    return response.data;
  }

  // Settings
  async getSettings() {
    const response = await this.api.get('/settings');
    return response.data;
  }

  async updateSettings(settings) {
    const response = await this.api.put('/settings', settings);
    return response.data;
  }
}

export const apiService = new ApiService();