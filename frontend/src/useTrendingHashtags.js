import { ref, onMounted } from 'vue';

export function useTrendingHashtags(hours = 24, limit = 20) {
  const trendingHashtags = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function fetchTrending() {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`https://199-ten.vercel.app/api/features?hours=${hours}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to load trending hashtags');
      const data = await res.json();
      trendingHashtags.value = data.trending_hashtags;
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    fetchTrending();
  });

  function formatDate(dateStr) {
    return dateStr ? new Date(dateStr).toLocaleString() : '-';
  }

  return {
    trendingHashtags,
    loading,
    error,
    fetchTrending,
    formatDate
  };
}
