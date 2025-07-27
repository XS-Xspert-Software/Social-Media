// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const Posts = () => import('../Posts.vue')
const Videos = () => import('../Videos.vue')
const Chat = () => import('../Chat.vue')
const Settings = () => import('../Settings.vue')
const Search2 = () => import('../Search2.vue')
const Chatbox = () => import('../Chatbox.vue')
const Float = () => import('../Float.vue')
const Notification = () => import('../Notification.vue')
const PostPage = () => import('../PostPage.vue') // ✅ Added this line
const GroupChatbox = () => import('../GroupChat.vue') // Fix import path for group chat

const routes = [
  { path: '/', name: 'Posts', component: Posts },
  { path: '/user/:username', name: 'UserProfile', component: Search2, props: true },
  { path: '/videos', name: 'Videos', component: Videos },
  { path: '/chat', name: 'Chat', component: Chat },
  { path: '/float', name: 'Float', component: Float },
  { path: '/settings', name: 'Settings', component: Settings },
  { path: '/search', name: 'Search', component: Search2 },
  { path: '/chatbox', name: 'Chatbox', component: Chatbox },
  { path: '/chat/:groupId/:groupName', name: 'GroupChatbox', component: GroupChatbox },
  { path: '/notification', name: 'Notification', component: Notification },
  { path: '/post/:id', name: 'PostPage', component: PostPage }, 
  { path: '/:catchAll(.*)', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

