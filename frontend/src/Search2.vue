<template>
  <body>
  <div>
    <!-- Loading Spinner -->
    <div id="loading" v-show="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <!-- Search Input -->
<div v-if="!userProfile" class="search-container" style="margin: 60px 0; display: flex; align-items: center; justify-content: center; gap: 6px;">

  <!-- Back Button (no style changes) -->
  <button @click="$router.push('/')">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; color: #007bff;font-size: large;">
      <path d="m12 19-7-7 7-7"/>
      <path d="M19 12H5"/>
    </svg>
  </button>

  <!-- Slightly Larger Input -->
  <input
    v-model="searchQuery"
    type="text"
    placeholder="Search..."
    @keyup.enter="searchUser"
    aria-label="Search for a user by username"
    style="width: 70%; padding: 4px 8px; border-radius: 999px; border: 1px solid #555; background-color: #2c2c2c; color: #fff; font-size: 12px; line-height: 1.4; outline: none; height: 35px;"
  />

  <!-- Slightly Larger Button -->
  <button
    @click="searchUser"
    style="background-color: #007bff; color: white; padding: 4px 8px; border: none; border-radius: 999px; cursor: pointer; font-size: 12px; line-height: 1.4; height: 31px;"
  >
    Search
  </button>
</div>
        <!-- No User Found -->
    <div v-if="searched && !userProfile" class="no-user" style="text-align: center; color: #ccc; margin: 20px 0;">
       <p>User not found.</p>
          <button @click="$router.push('/')" style="background-color: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 25px; cursor: pointer;">
           Back to Feed
          </button>
    </div>

    <!-- Trending Hashtags Section - Now separate from search container -->
    <div v-if="!userProfile" class="trending-container" style="margin: 20px auto; max-width: 600px; padding: 0 20px;">
      <h2 style="color: #fff; font-size: 18px; margin-bottom: 15px;">Trending Hashtags (Last {{ hours || 24 }} hours)</h2>

      <div v-if="trendingLoading" style="color: #ccc; text-align: center; padding: 20px;">
        Loading trending hashtags...
      </div>
      
      <div v-else-if="trendingError" style="color: #ff6b6b; text-align: center; padding: 20px;">
        Error: {{ trendingError }}
      </div>
      
      <div v-else>
        <div v-if="trendingHashtags.length === 0" style="color: #999; text-align: center; padding: 20px;">
          No trending hashtags found.
        </div>
        
        <ul v-else style="list-style: none; padding: 0; margin: 0;">
          <li v-for="hashtag in trendingHashtags" :key="hashtag.hashtag" 
              style="background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border-radius: 12px; padding: 15px; margin-bottom: 12px; border-left: 3px solid #007bff;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: #007bff; font-size: 16px;">#{{ hashtag.hashtag }}</strong>
              <span style="color: #999; font-size: 12px;">
                {{ hashtag.count }} posts, {{ hashtag.unique_user_count }} users
              </span>
            </div>
            
            <div style="color: #aaa; font-size: 11px; margin-bottom: 10px;">
              <small>First: {{ formatDate(hashtag.first_seen) }}</small> • 
              <small>Last: {{ formatDate(hashtag.last_seen) }}</small>
            </div>

            <div v-if="hashtag.recent_posts && hashtag.recent_posts.length" style="margin-top: 10px;">
              <small style="color: #ccc; display: block; margin-bottom: 8px;">Recent posts:</small>
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li v-for="post in hashtag.recent_posts" :key="post.post_id + post.created_at"
                    style="display: flex; align-items: center; padding: 6px 0; border-bottom: 1px solid #333;">
                  <img 
                    v-if="post.profile_picture"
                    :src="post.profile_picture"
                    alt="User pic"
                    class="profile-pic"
                    style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; margin-right: 8px;"
                  />
                  <span style="color: #ddd; font-size: 12px; flex: 1;">
                    {{ post.username }} - {{ formatDate(post.created_at) }}
                  </span>
                  <a :href="`/post/${post._id}`" target="_blank" 
                  
                     style="color: #007bff; font-size: 11px; text-decoration: none; margin-left: 8px;">
                    View
                  </a>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- User Profile -->
   <div v-if="userProfile" class="user-profile-container">
  <!-- Header Section with Background -->
  <div class="profile-header" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem;">
    
    <!-- Back Button -->
    <button
      @click="resetSearch"
      class="back-button"
      style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;"
      @mouseover="$event.target.style.transform = 'translateX(-2px)'"
      @mouseout="$event.target.style.transform = 'translateX(0)'"
      aria-label="Back to search"
    >
      <svg width="25" height="25" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m12 19-7-7 7-7"/>
        <path d="M19 12H5"/>
      </svg>
    </button>

    <!-- Right-side actions -->
    <div style="display: flex; align-items: center; gap: 12px;">
      <!-- Share Button -->
      <button class="share-btn" @click="sharePost" aria-label="Share post"
        style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
        </svg>
      </button>

      <!-- More Actions -->
      <div class="more-actions" style="position: relative;">
        <button class="more-btn" @click="(e)=>toggleMoreMenu(e)" aria-label="More options"
          style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>

        <!-- Dropdown portaled to body to avoid clipping -->
        <Teleport to="body">
      <div v-if="showMoreMenu" class="more-menu portal" :style="{
              position: 'fixed',
              top: headerMenuCoords.top + 'px',
              left: headerMenuCoords.left + 'px',
        minWidth: '200px',
              zIndex: 2000
            }">
            <!-- Add menu options here -->
          </div>
        </Teleport>
      </div>
    </div>
  </div>

  <!-- Main Profile Content -->
  <div class="profile-content">
    <!-- Profile Info Section -->
    <div class="profile-info">
      <!-- Profile Picture -->
      <div class="profile-picture-wrapper">
        <img 
          :src="userProfile.profilePicture || 'pfp2.jpg'" 
          :alt="`${userProfile.username}'s profile picture`"
          class="profile-picture"
          style=" width: 120px;height: 120px;border-radius: 50%;border: 4px solid #1a1a1a;object-fit: cover;box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8), 0 0 0 3px rgba(255, 255, 255, 0.2);"
           />
        <div class="profile-status"></div>
      </div>

      <!-- User Details -->
      <div class="user-details">
        <h1 class="username" style="  font-size: 2rem;color: #ffffff;margin-bottom: 0.5rem;text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">{{ userProfile.username }}</h1>
        <div class="user-meta" v-if="userProfile.description">
          <p class="description">{{ userProfile.description }}</p>
        </div>

        <!-- Stats Row -->
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-number">{{ userProfile.followersCount || 0 }}</span>
            <span class="stat-label">Followers</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">{{ userProfile.followingCount || 0 }}</span>
            <span class="stat-label">Following</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">{{ userProfile.friendsCount || 0 }}</span>
            <span class="stat-label">Friends</span>
          </div>
        </div>

        <!-- Additional Info -->
        <div class="additional-info">
          <div v-if="userProfile.created_at" class="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>Joined {{ userProfile.created_at }}</span>
          </div>
          
          <div v-if="userProfile.Music" class="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
            <span>{{ userProfile.Music }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
     <div v-if="userProfile.username !== loggedInUsername" class="social-actions" style=" margin-top: 12px;
    
    justify-content: flex-start;
    flex-wrap: wrap;
    padding-bottom: 4px; ">
        <!-- Follow/Unfollow Button -->
        <button
          @click="toggleFollow"
          :disabled="actionLoading"
          :style="{
            backgroundColor: relationshipStatus.isFollowing ? '#dc3545' : '#28a745',
            color: 'white',
            padding: '8px 16px',
            gap: '20px' ,
            border: 'none',
            borderRadius: '20px',
            cursor: actionLoading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            opacity: actionLoading ? 0.6 : 1
          }"
        >
          {{ actionLoading ? 'Loading...' : (relationshipStatus.isFollowing ? 'Unfollow' : 'Follow') }}
        </button>

        <!-- Friend Request Button -->
        <button
          @click="toggleFriendship"
          :disabled="actionLoading"
          :style="{
            backgroundColor: getFriendButtonColor(),
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '20px',
            cursor: actionLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: actionLoading ? 0.6 : 1
          }"
        >
          {{ actionLoading ? 'Loading...' : getFriendButtonText() }}
        </button>
        
        <button
          @click="startChat"
          style="
            background-color: #007bff;
            color: white;
            padding: 8px 16px;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
          "
        >
            Message
        </button>
      </div>
    </div>

    <!-- Posts/Shorts Navigation -->
    <div v-if="userProfile" class="content-tabs" style="margin:20px 0;border-bottom:1px solid #333;display:flex;justify-content:space-around;padding:0 30px;gap:24px;">
            <button 
              @click="switchTab('posts')" 
              :class="{ active: currentTab === 'posts' }"
              style="padding: 10px 20px; background: none; border: none; color: #ccc; cursor: pointer; border-bottom: 2px solid transparent;"
              :style="{ color: currentTab === 'posts' ? '#fff' : '#ccc', borderBottomColor: currentTab === 'posts' ? '#007bff' : 'transparent' }"
            >
              Posts
            </button>
            <button 
              @click="switchTab('shorts')" 
              :class="{ active: currentTab === 'shorts' }"
              style="padding: 10px 20px; background: none; border: none; color: #ccc; cursor: pointer; border-bottom: 2px solid transparent;"
              :style="{ color: currentTab === 'shorts' ? '#fff' : '#ccc', borderBottomColor: currentTab === 'shorts' ? '#007bff' : 'transparent' }"
            >
              Shorts
            </button>
          </div>

          <!-- Posts Content -->
          <div v-if="userProfile && currentTab === 'posts'" class="posts-container">
            <div v-if="getUserPosts.length === 0" style="text-align: center; color: #ccc; padding: 40px 0;">
              <p>No posts found.</p>
            </div>
            <div v-else>
              <div v-for="post in getUserPosts" :key="post._id" class="post-card" :data-id="post._id" :data-liked-by="JSON.stringify(post.likedBy || [])">
                <!-- Reply Preview -->
                   <div v-if="post.replyTo" class="reply-preview" style="background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border-left: 2px solid #00b4d8; padding: 10px; margin-bottom: 12px; border-radius: 8px; box-shadow: 0 0 6px rgba(0, 180, 216, 0.3);">
                  <div class="reply-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                    <img :src="post.replyTo.profilePicture || 'https://latestnewsandaffairs.site/public/pfp.jpg'" alt="User Profile Picture" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid #444;" />
                    <div style="display: flex; flex-direction: column;">
                      <strong style="color: #00b4d8;">{{ post.replyTo.username }}</strong>
                      <small style="color: #999;">{{ postsStore.formatTimestamp(post.replyTo.timestamp) }}</small>
                    </div>
                  </div>
                  <div @click="$router.push(`/post/${post.replyTo._id}`)">
                    <p class="preview-message clickable" v-html="postsStore.parseMessage(post.replyTo.message)"></p>
                  </div>
                  <img v-if="post.replyTo.photo" :src="post.replyTo.photo" alt="Replied Post Image" class="preview-image" />
                </div>
                
                <!-- Quote Preview -->
                <div v-if="post.quoteTo" class="preview-card quote-preview">
                  <div class="preview-header">
                    <img :src="post.quoteTo.profilePicture || 'https://latestnewsandaffairs.site/public/pfp.jpg'" alt="User Profile Picture" class="preview-avatar" />
                    <div class="preview-user-info">
                      <strong class="preview-username">{{ post.quoteTo.username }}</strong>
                      <small class="preview-timestamp">{{ postsStore.formatTimestamp(post.quoteTo.timestamp) }}</small>
                    </div>
                  </div>
                  <p class="preview-message" v-html="postsStore.parseMessage(post.quoteTo.message)"></p>
                  <img v-if="post.quoteTo.photo" :src="post.quoteTo.photo" alt="Quoted Post Image" class="preview-image" />
                </div>
                
                <!-- Post Header -->
                <div class="post-header">
                  <div class="profile-picture clickable" @click="redirectToUserProfile(post.username)">
                    <img :src="post.profilePicture || 'pfp2.jpg'" :alt="`${post.username}'s profile picture`" />
                  </div>
                  <div class="username clickable" @click="postsStore.redirectToUserProfile(post.username)">
                    <strong>{{ post.username }}</strong>
                    <span class="verified-badge" title="Verified">
                      <i class="fa-solid fa-circle-check"></i>
                    </span>
                  </div>
                </div>
                
                <!-- Post Message -->
                <p class="post-message" v-html="postsStore.parseMessage(post.message)" @click="$router.push(`/post/${post._id}`)"></p>
                
                <!-- Post Image -->
                <img v-if="post.photo" :src="post.photo" alt="Post Image" class="post-image" @click="$router.push(`/post/${post._id}`)" />
                
                <!-- Post Timestamp -->
                <div class="post-timestamp">
                  <small>{{ postsStore.formatTimestamp(post.timestamp) }}</small>
                </div>
                
                <!-- Actions -->
                <div class="actions">
      <button
  class="action-btn like-btn"
  :class="{ liked: post.likedBy?.includes(postsStore.loggedInUsername) }"
  @click="postsStore.likePost(post._id)"
>
  <svg
  viewBox="0 0 24 24"
  width="12"
  height="12"
  class="heart-icon"
>
  <path
    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
       2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09 
       C13.09 3.81 14.76 3 16.5 3 
       19.58 3 22 5.42 22 8.5 
       c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
    stroke="#fff"
    stroke-width="1.2"
  />
</svg>
  {{ post.likes || 0 }}
</button>

    <button
  class="action-btn views-btn"
  :class="{ viewed: post.viewedBy?.includes(postsStore.loggedInUsername) }"
  @click="postsStore.viewPost(post._id)"
>
  <svg
    viewBox="0 0 24 24"
    width="12"
    height="12"
    class="views-icon"
  >
    <path
      d="M3 12h4l3-9 4 18 3-9h4"
      stroke="#fff"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <circle
      cx="12"
      cy="12"
      r="2"
      stroke="#fff"
      stroke-width="1.5"
      opacity="0.6"
      fill="none"
    />
  </svg>
  {{ formatViewCount(post.views_count || 0) }} views
</button>
      
        <button
  class="action-btn comment-btn"
  @click="$router.push(`/post/${post._id}`)"
  style="margin-top: 5px;"
>
  <svg
    viewBox="0 0 24 24"
    width="12"
    height="12"
    fill="none"           
    stroke="#fff"         
    stroke-width="1.2"
    stroke-linejoin="round"
    stroke-linecap="round"
  >
    <path
      d="M12 3C6.48 3 2 6.92 2 11.5c0 2.14 1.06 4.1 2.83 5.6L4 21l3.65-1.95
         c1.29.45 2.7.7 4.35.7 5.52 0 10-3.92 10-8.5S17.52 3 12 3z"
      fill="#222"          
    />
  </svg>
  {{ post.commentCount || 0 }}
</button>

<button
  class="action-btn tweet-btn" 
  :class="{ replied: post.repliedBy?.includes(postsStore.loggedInUsername) }"
   @click="tweetPost(post._id, post.username)"
>
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    class="reply-icon"
  >
    <path
      d="M9 17l-5-5 5-5"
      stroke="#fff"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <path
      d="M20 18v-2a4 4 0 0 0-4-4H4"
      stroke="#fff"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
  </svg>
  {{ post.replies || 0 }}
</button>
                  
                  <button v-if="post.username === postsStore.loggedInUsername || post.sessionId === postsStore.sessionId" class="action-btn" @click="postsStore.editPost(post._id, post.username)">
                    Edit
                  </button>
                  
                  <button v-if="post.username === postsStore.loggedInUsername || post.sessionId === postsStore.sessionId" class="action-btn" @click="postsStore.deletePost(post._id)">
                    Delete
                  </button>
                </div>
                 </div>
            </div>
          </div>

          <!-- Shorts Content -->
          <div v-if="userProfile && currentTab === 'shorts'" class="shorts-container">
            <div v-if="getUserShorts.length === 0" style="text-align: center; color: #ccc; padding: 40px 0;">
              <p>No shorts found.</p>
            </div>
            <div v-else>
              <div v-for="short in getUserShorts" :key="short._id" class="post-card short-card" :data-id="short._id">
                <!-- Short content similar to posts but for shorts -->
                <div class="post-header">
                  <div class="profile-picture clickable" @click="redirectToUserProfile(short.username)">
                    <img :src="short.profilePicture || 'pfp2.jpg'" :alt="`${short.username}'s profile picture`" />
                  </div>
                  <div class="username clickable" @click="postsStore.redirectToUserProfile(short.username)">
                    <strong>{{ short.username }}</strong>
                  </div>
                </div>
                
                <p class="post-message" v-html="postsStore.parseMessage(short.message)" @click="$router.push(`/post/${short._id}`)"></p>
                <img v-if="short.photo" :src="short.photo" alt="Short Image" class="post-image" @click="$router.push(`/post/${short._id}`)" />
                
                <div class="post-timestamp">
                  <small>{{ postsStore.formatTimestamp(short.timestamp) }}</small>
                </div>
                
                <div class="actions">
                  <button class="action-btn like-btn" :class="{ liked: short.likedBy?.includes(postsStore.loggedInUsername) }" @click="postsStore.likePost(short._id)">
                    <svg viewBox="0 0 24 24">
                      <path d="M1 21h4V9H1v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32a1 1 0 0 0-.29-.7L14 2 7.59 8.41A1.98 1.98 0 0 0 7 9.83V19a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2l1-7v-.01L23 10z"/>
                    </svg>
                    {{ short.likes || 0 }}
                  </button>
                  
                  <button class="comment-btn" @click="$router.push(`/post/${short._id}`)" style="color: #1da1f2; border: none;">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12 3C6.48 3 2 6.92 2 11.5c0 2.14 1.06 4.1 2.83 5.6L4 21l3.65-1.95c1.29.45 2.7.7 4.35.7 5.52 0 10-3.92 10-8.5S17.52 3 12 3z"/>
                    </svg>
                    ({{ short.comments?.length || 0 }})
                  </button>
                  
                  <button v-if="short.username === postsStore.loggedInUsername || short.sessionId === postsStore.sessionId" class="action-btn" @click="postsStore.deletePost(short._id)">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal -->
      <div v-if="postsStore.showModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Confirm Action</h3>
          </div>
          <div class="modal-body">
            <p>{{ postsStore.modalMessage }}</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" @click="postsStore.closeModal">Cancel</button>
            <button class="btn btn-primary" @click="postsStore.modalAction">
              {{ postsStore.modalActionText }}
            </button>
          </div>
        </div>
      </div>

  </body>
</template>

<script setup>
import { ref, onMounted, watch, inject, computed } from 'vue';
import debounce from 'lodash/debounce';
import { usePostsStore } from './stores/postsStore';
import { useRouter, useRoute } from 'vue-router';
import { useTrendingHashtags } from './useTrendingHashtags.js';

const { trendingHashtags, loading: trendingLoading, error: trendingError, formatDate } = useTrendingHashtags(24, 20);
const postsStore = usePostsStore();
const notify = inject('notify');
const router = useRouter();
const route = useRoute();

// Reactive state
const userPosts = ref([]);
const userId = ref(localStorage.getItem('userId') || '');
const username = ref(route.params.username ?? '');
const searchQuery = ref(route.params.username ?? '');
const userProfile = ref(null);
const searched = ref(false);
const actionLoading = ref(false);
const loggedInUsername = ref(localStorage.getItem('username') || '');
const loading = ref(false);
const relationshipStatus = ref({ isFollowing: false, friendshipStatus: 'none' });
const currentTab = ref('posts');
const showMoreMenu = ref(false);
const headerMenuCoords = ref({ top: 0, left: 0 });
const hours = ref(24);

const formatViewCount = (count) => {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return count.toString();
};

// Computed properties
const getUserPosts = computed(() => {
  return userProfile.value?.username 
    ? postsStore.posts.filter(post => post.username === userProfile.value.username)
    : [];
});

const getUserShorts = computed(() => {
  return userProfile.value?.username 
    ? postsStore.shorts?.filter(short => short.username === userProfile.value.username) || []
    : [];
});

const shouldShowHashtags = computed(() => {
  return !userProfile.value && (!searched.value || (searched.value && !userProfile.value));
});

const isOwnProfile = computed(() => {
  return loggedInUsername.value && userProfile.value &&
         loggedInUsername.value === userProfile.value.username;
});

const shouldShowRelationshipButtons = computed(() => {
  return loggedInUsername.value && !isOwnProfile.value;
});

// Tab switching functionality
const switchTab = (tabName) => {
  currentTab.value = tabName;
};

// Share functionality with native device sharing
const sharePost = async () => {
  const shareData = {
    title: `${userProfile.value?.username}'s Profile`,
    text: `Check out ${userProfile.value?.username}'s profile`,
    url: window.location.href,
  };

  try {
    // Check if Web Share API is supported
    const canShare = navigator.share && navigator.canShare && navigator.canShare(shareData);
    
    if (canShare) {
      await navigator.share(shareData);
      notify('Shared successfully!', false);
      return;
    }

    // Fallback to clipboard
    await navigator.clipboard.writeText(window.location.href);
    notify('Profile link copied to clipboard!', false);
  } catch (error) {
    console.error('Share failed:', error);
    
    // Final fallback - create temporary input for copying
    try {
      const tempInput = document.createElement('input');
      tempInput.value = window.location.href;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      notify('Profile link copied to clipboard!', false);
    } catch (fallbackError) {
      notify('Unable to share or copy link', true);
    }
  }
};

// More menu toggle with viewport-fixed coordinates to avoid clipping
const computeHeaderMenuCoords = (e) => {
  try {
    const btn = e?.currentTarget || e?.target?.closest('button');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const estimatedWidth = 200;
    const padding = 12;
    let left = rect.right - estimatedWidth;
    left = Math.max(padding, Math.min(left, window.innerWidth - estimatedWidth - padding));
    const top = Math.min(rect.bottom + 6, window.innerHeight - 10);
    headerMenuCoords.value = { top, left };
  } catch {}
};
const toggleMoreMenu = (e) => {
  if (showMoreMenu.value) { showMoreMenu.value = false; return; }
  computeHeaderMenuCoords(e);
  showMoreMenu.value = true;
};

// Follow/Unfollow functionality
const toggleFollow = async () => {
  if (!userProfile.value || actionLoading.value) return;

  actionLoading.value = true;
  
  try {
    const action = relationshipStatus.value.isFollowing ? 'unfollow' : 'follow';

    const response = await fetch(`https://sports321.vercel.app/api/Follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        follower: loggedInUsername.value,
        following: userProfile.value.username
      })
    });

    if (!response.ok) throw new Error('Failed to update follow status');

    relationshipStatus.value.isFollowing = !relationshipStatus.value.isFollowing;
    await fetchUserData(userProfile.value.username);

    const message = relationshipStatus.value.isFollowing ? 'Successfully followed user' : 'Successfully unfollowed user';
    notify(message, false);
  } catch (error) {
    console.error('Error toggling follow:', error);
    notify('Failed to update follow status', true);
  } finally {
    actionLoading.value = false;
  }
};

// Friend request functionality
const toggleFriendship = async () => {
  if (!userProfile.value || actionLoading.value) return;

  actionLoading.value = true;
  
  try {
    const { action, body, successMessage } = getFriendshipActionData();

    const response = await fetch(`https://sports321.vercel.app/api/Follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body })
    });

    if (!response.ok) throw new Error('Failed to update friendship status');

    updateFriendshipStatus();
    await fetchUserData(userProfile.value.username);
    notify(successMessage, false);
  } catch (error) {
    console.error('Error toggling friendship:', error);
    notify('Failed to update friendship status', true);
  } finally {
    actionLoading.value = false;
  }
};

const getFriendshipActionData = () => {
  const baseBody = {
    requester: loggedInUsername.value,
    recipient: userProfile.value.username
  };

  const actions = {
    'none': {
      action: 'add_friend',
      body: baseBody,
      successMessage: 'Friend request sent'
    },
    'pending_sent': {
      action: 'remove_friend',
      body: baseBody,
      successMessage: 'Friend request cancelled'
    },
    'pending_received': {
      action: 'add_friend',
      body: {
        requester: userProfile.value.username,
        recipient: loggedInUsername.value
      },
      successMessage: 'Friend request accepted'
    },
    'friends': {
      action: 'remove_friend',
      body: baseBody,
      successMessage: 'Friend removed'
    }
  };

  return actions[relationshipStatus.value.friendshipStatus] || actions['none'];
};

const updateFriendshipStatus = () => {
  const statusMap = {
    'none': 'pending_sent',
    'pending_sent': 'none',
    'pending_received': 'friends',
    'friends': 'none'
  };

  const newStatus = statusMap[relationshipStatus.value.friendshipStatus] || 'none';
  relationshipStatus.value.friendshipStatus = newStatus;

  // Dispatch notification event for friend requests
  if (newStatus === 'pending_sent') {
    window.dispatchEvent(new CustomEvent('new-notification', {
      detail: {
        sender: loggedInUsername.value,
        recipient: userProfile.value.username
      }
    }));
  }
};

const getFriendButtonText = () => {
  const textMap = {
    'none': 'Add Friend',
    'pending_sent': 'Cancel Request',
    'pending_received': 'Accept Request',
    'friends': 'Remove Friend'
  };
  return textMap[relationshipStatus.value.friendshipStatus] || 'Add Friend';
};

const getFriendButtonColor = () => {
  const colorMap = {
    'none': '#007bff',
    'pending_sent': '#ffc107',
    'pending_received': '#28a745',
    'friends': '#dc3545'
  };
  return colorMap[relationshipStatus.value.friendshipStatus] || '#007bff';
};

// Check relationship status
const checkRelationshipStatus = async (targetUsername) => {
  if (!loggedInUsername.value || !targetUsername || loggedInUsername.value === targetUsername) {
    relationshipStatus.value = { isFollowing: false, friendshipStatus: 'none' };
    return;
  }
  
  try {
    const response = await fetch(`https://sports321.vercel.app/api/Follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        currentUser: loggedInUsername.value, 
        targetUser: targetUsername 
      })
    });

    if (response.ok) {
      const data = await response.json();
      relationshipStatus.value = {
        isFollowing: data.isFollowing || false,
        friendshipStatus: data.friendshipStatus || 'none'
      };
    }
  } catch (error) {
    console.error('Error checking relationship status:', error);
    relationshipStatus.value = { isFollowing: false, friendshipStatus: 'none' };
  }
};

// Fetch user data
const fetchUserData = async (usernameToFetch) => {
  if (!usernameToFetch) return;

  loading.value = true;
  searched.value = false;
  userProfile.value = null;
  
  try {
    const response = await fetch(`https://sports321.vercel.app/api/search?username=${usernameToFetch}&postsOnly=true`, {
      headers: { 'Content-Type': 'application/json' },
    });

    searched.value = true;

    if (!response.ok) {
      userProfile.value = null;
      userPosts.value = [];
      
      if (response.status === 404) {
        notify('User not found', true);
        return;
      }
      throw new Error('Failed to fetch user data');
    }

    const data = await response.json();

    const user = data.user;
    userProfile.value = {
      username: user.username,
      userId: user.id,
      profilePicture: user.profile_picture,
      description: user.description,
      created_at: user.created_at,
      Music: user.Music,
      followersCount: user.followers_count || 0,
      followingCount: user.following_count || 0,
      friendsCount: user.friends_count || 0,
    };

    const filteredPosts = data.posts ? data.posts
      .filter(post => {
        return post.username === usernameToFetch || 
               post.author === usernameToFetch || 
               post.userId === user.id || 
               post.user_id === user.id;
      })
      .map(post => ({
        ...post,
        comments: post.comments?.map(comment => ({
          ...comment,
          showReplies: false,
          replies: Array.isArray(comment.replies) ? comment.replies : [],
        })) || [],
        likedBy: post.likedBy || [],
        dislikedBy: post.dislikedBy || [],
        views: post.views || 0,
      })) : [];

    userPosts.value = filteredPosts;
    await checkRelationshipStatus(usernameToFetch);
  } catch (error) {
    console.error('Error fetching user data:', error);
    searched.value = true;
    userProfile.value = null;
    userPosts.value = [];
    notify(`Error: ${error.message}`, true);
  } finally {
    loading.value = false;
  }
};

// Search functionality
const searchUser = debounce(() => {
  if (!searchQuery.value.trim()) {
    notify('Please enter a username', true);
    return;
  }
  router.push(`/user/${searchQuery.value.trim()}`);
}, 300);

// Reset search
const resetSearch = () => {
  userProfile.value = null;
  searched.value = false;
  searchQuery.value = '';
  userPosts.value = [];
  relationshipStatus.value = { isFollowing: false, friendshipStatus: 'none' };
  currentTab.value = 'posts';
  router.push({ name: 'Posts' });
};

// Start chat
const startChat = () => {
  const user = userProfile.value;

  if (!user?.username || !user.userId) {
    notify('Cannot start chat: missing user information.', true);
    return;
  }

  const updates = {
    chatWith: user.username,
    chatWithId: user.userId,
    profileImage: user.profilePicture || 'default-pfp.jpg'
  };

  Object.entries(updates).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });

  router.push({
    name: 'Chatbox',
    params: {
      userId: user.userId,
      username: user.username
    }
  });
};

// Redirect to user profile
const redirectToUserProfile = (username) => {
  if (username) {
    router.push(`/user/${username}`);
  }
};
// Navigate to Upload.vue for tweeting/replying
function tweetPost(postId, username) {
  const u = localStorage.getItem('username');
  if (!u || u === 'Guest') {
    notify('Please log in to reply to posts', true);
    window.location.href = 'https://latestnewsandaffairs.site/public/signup';
    return;
  }
  router.push({ path: '/float', query: { replyToPostId: postId, replyToUsername: username } });
}

// Lifecycle hooks
onMounted(() => {
  if (username.value) {
    fetchUserData(username.value);
  }
});

// Watchers
watch(() => route.params.username, (newUsername) => {
  if (newUsername) {
    username.value = newUsername;
    searchQuery.value = newUsername;
    fetchUserData(newUsername);
  }
});

watch(() => localStorage.getItem('username'), (newUsername) => {
  loggedInUsername.value = newUsername || '';
  if (userProfile.value) {
    checkRelationshipStatus(userProfile.value.username);
  }
});

// Close more menu when clicking outside or on scroll/resize
watch(showMoreMenu, (isOpen) => {
  if (isOpen) {
    const closeMenu = (e) => {
      if (!e.target.closest('.more-actions')) {
        showMoreMenu.value = false;
        document.removeEventListener('click', closeMenu);
        window.removeEventListener('scroll', closeMenu, true);
        window.removeEventListener('resize', closeMenu, true);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
      window.addEventListener('scroll', closeMenu, true);
      window.addEventListener('resize', closeMenu, true);
    }, 100);
  }
});

// Expose for template
defineExpose({
  userPosts,
  userProfile,
  loading,
  searched,
  shouldShowHashtags,
  shouldShowRelationshipButtons,
  isOwnProfile,
  toggleFollow,
  toggleFriendship,
  startChat,
  searchUser,
  resetSearch,
  redirectToUserProfile,
  getFriendButtonText,
  getFriendButtonColor,
  relationshipStatus,
  actionLoading,
  loggedInUsername,
  searchQuery,
  trendingHashtags,
  trendingLoading,
  trendingError,
  formatDate,
  currentTab,
  switchTab,
  sharePost,
  toggleMoreMenu,
  showMoreMenu,
  getUserPosts,
  tweetPost,
  getUserShorts,
  hours
});
</script>

<style src="./Posts.css"></style>
<!-- Fade-in animation style -->
<style scoped>
.heart-icon{fill:#222;transition:fill .3s ease,stroke .3s ease}.like-btn.liked .heart-icon{fill:#ff4d4d;stroke:#ff4d4d}.views-icon{transition:stroke .3s ease,transform .2s ease,opacity .2s ease}.reply-icon{transition:stroke .3s ease,transform .2s ease}.thumbs-down-icon,.round.comments{vertical-align:middle;margin-right:6px;transform:scaleX(-1)}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.user-profile-container {
  max-width: 800px;
  margin-top: 30px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}
.profile-header {
  position: relative;
  background: linear-gradient(135deg, #2a2a2a 0%, #404040 50%, #2a2a2a 100%);
  border-bottom: 2px solid #555555;
  height: 120px;
  width: 100%;
}
.profile-content {
  padding: 0 2rem 2rem;
  position: relative;
}
.profile-info {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  margin-top: -50px;
  position: relative;
  z-index: 2;
}
.profile-picture-wrapper {
  position: relative;
  flex-shrink: 0;
}
@media (min-width: 768px) {
   .profile-picture-wrapper{
    margin-top: 150px;
   }
}
.user-details {
  flex: 1;
  margin-top: 70px;
}
.description {
  color: #cccccc;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem 0;
  border-top: 2px solid #444444;
  border-bottom: 2px solid #444444;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-number {
  font-size: 1.2rem;
  color: #ffffff;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

.stat-label {
  font-size: 11px;
  color: #bbbbbb;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-divider {
  width: 2px;
  height: 30px;
  background: #555555;
}

.additional-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #dddddd;
  font-size: 0.9rem;
}

.info-item svg {
  color: #bbbbbb;
}

.no-user-content p {
  color: #bbbbbb;
  margin-bottom: 2rem;
  line-height: 1.6;
}
@media (max-width: 768px) {
  .user-profile-container {
    margin: 1rem;
    border-radius: 12px;
  }
  .profile-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }
  .user-details {
    margin-top: 1rem;
  }
  .stats-row {
    justify-content: center;
  }
}
</style>
