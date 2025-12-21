// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const Posts = () => import('../Posts.vue')
const Videos = () => import('../Videos.vue')
const Chat = () => import('../Chat.vue')
const Settings = () => import('../Settings.vue')
const Search2 = () => import('../Search2.vue')
const Chatbox = () => import('../Chatbox.vue')
const PostPage = () => import('../PostPage.vue')
const Float = () => import('../Float.vue')
const Admin = () => import('../Admin.vue')
const Notification = () => import('../Notification.vue')

const routes = [
  { path: '/', name: 'Posts', component: Posts },
  { path: '/user/:username', name: 'UserProfile', component: Search2, props: true },
  { path: '/videos', name: 'Videos', component: Videos },
  { path: '/float', name: 'Float', component: Float },
  { path: '/settings', name: 'Settings', component: Settings },
  { path: '/search', name: 'Search', component: Search2 },
  { path: '/chatbox', name: 'Chatbox', component: Chatbox },
  { path: '/post/:id', name: 'PostPage', component: PostPage },
  { path: '/notification', name: 'Notification', component: Notification },
  { path: '/chat', name: 'Chat', component: Chat, children:[
      {
        path: '',
        name: 'ChatHome', // Named empty child fixes Vue Router warning
        redirect: 'live'
      },
      { path: 'live', name: 'LiveChat', meta: { section: 'Live' } },
      { path: 'world', name: 'WorldChat', meta: { section: 'WorldChat' } },
  // Group chat routes removed for a simpler chat experience
    ]
  },
  // Direct routes to keep Chat accessible when navigating via tabs/links
  { path: '/chat/friends', name: 'ChatFriends', component: Chat, meta: { section: 'Friends' } },
  { path: '/chat/live', name: 'ChatLive', component: Chat, meta: { section: 'Live' } },
  { path: '/chat/world', name: 'ChatWorld', component: Chat, meta: { section: 'WorldChat' } },
  { path: '/admin', name: 'Admin', component: Admin },
  { path: '/:catchAll(.*)', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

