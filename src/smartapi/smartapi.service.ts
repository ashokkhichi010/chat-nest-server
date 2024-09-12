import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class SmartApiService {
  private axiosInstance: AxiosInstance;
  private authToken: string;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.SMARTAPI_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-PrivateKey': process.env.SMARTAPI_KEY,
      },
    });

    this.authenticate();
  }

  private async authenticate() {
    try {
      const response = await this.axiosInstance.post('/smartapi/v1/user/login', {
        clientcode: process.env.SMARTAPI_CLIENT_ID,
        password: process.env.SMARTAPI_PASSWORD,
        // totp: process.env.SMARTAPI_TOTP,  // If using TOTP
      });

      console.log('Authentication Response:', response);

      if (response.data?.data?.jwtToken) {
        this.authToken = response.data.data.jwtToken;
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
        console.log('Authentication successful');
      } else {
        console.error('Authentication failed: JWT token not found in response');
      }
    } catch (error) {
      console.error('Failed to authenticate with SmartAPI:', error);
    }
  }


  async getMarketData(symbol: string) {
    try {
      const response = await this.axiosInstance.get(`/smartapi/v1/quote`, {
        params: {
          exchange: 'NSE',
          tradingsymbol: symbol,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      throw error;
    }
  }
}
