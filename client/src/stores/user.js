import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  async function login(username, password) {
    const res = await request.post('/auth/login', { username, password })
    token.value = res.token
    userInfo.value = res.user
    localStorage.setItem('token', res.token)
    localStorage.setItem('userInfo', JSON.stringify(res.user))
    return res
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  async function getUserInfo() {
    const res = await request.get('/auth/me')
    userInfo.value = res
    localStorage.setItem('userInfo', JSON.stringify(res))
    return res
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    login,
    logout,
    getUserInfo
  }
})
