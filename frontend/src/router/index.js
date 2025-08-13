// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const Posts = () => import('../Posts.vue')
const Videos = () => import('../Videos.vue')
const Chat = () => import('../Chat.vue')
const Settings = () => import('../Settings.vue')
const Search2 = () => import('../Search2.vue')
const Chatbox = () => import('../Chatbox.vue')
const PostPage = () => import('../PostPage.vue')
const GroupChatbox = () => import('../GroupChatbox.vue')
const Float = () => import('../Float.vue')
const Admin = () => import('../Admin.vue')

const routes = [
  { path: '/', name: 'Posts', component: Posts },
  { path: '/user/:username', name: 'UserProfile', component: Search2, props: true },
  { path: '/videos', name: 'Videos', component: Videos },
  { path: '/float', name: 'Float', component: Float },
  { path: '/settings', name: 'Settings', component: Settings },
  { path: '/search', name: 'Search', component: Search2 },
  { path: '/chatbox', name: 'Chatbox', component: Chatbox },
  { path: '/group-chat/:groupId/:groupName', name: 'GroupChatbox', component: GroupChatbox },
  { path: '/post/:id', name: 'PostPage', component: PostPage },
  { path: '/notification', name: 'Notification' },
  { path: '/chat', name: 'Chat', component: Chat, children:[
      {
        path: '',
        redirect: 'live' // Default redirect to live chat
      },
      {
        path: 'live',
        name: 'LiveChat',
        meta: { section: 'Live' }
      },
      {
        path: 'world',
        name: 'WorldChat', 
        meta: { section: 'WorldChat' }
      },
      {
        path: 'groups',
        name: 'GroupChat',
        meta: { section: 'GroupChat' }
      }
    ]
  },
  { path: '/admin', name: 'Admin', component: Admin },
  { path: '/:catchAll(.*)', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

