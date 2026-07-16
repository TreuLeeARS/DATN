import axiosClient from './axiosClient.js'

const shippingFeeApi = {
  calculate: (data) => axiosClient.post('/shipping-fee/calculate', data),
}

export default shippingFeeApi
