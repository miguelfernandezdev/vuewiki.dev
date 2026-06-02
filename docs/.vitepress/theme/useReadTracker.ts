import { ref, computed, onMounted, onUnmounted } from 'vue'

const STORAGE_KEY = 'vuewiki-read'
const readSet = ref<Set<string>>(new Set())

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    readSet.value = new Set(stored ? JSON.parse(stored) : [])
  } catch {
    readSet.value = new Set()
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...readSet.value]))
  window.dispatchEvent(new CustomEvent('vuewiki-read-change'))
}

export function useReadTracker() {
  const readCount = computed(() => readSet.value.size)

  function isRead(url: string) {
    return readSet.value.has(url)
  }

  function markRead(url: string) {
    if (readSet.value.has(url)) return
    const next = new Set(readSet.value)
    next.add(url)
    readSet.value = next
    saveToStorage()
  }

  function toggleRead(url: string) {
    const next = new Set(readSet.value)
    if (next.has(url)) {
      next.delete(url)
    } else {
      next.add(url)
    }
    readSet.value = next
    saveToStorage()
  }

  function onStorageChange(e: StorageEvent) {
    if (e.key === STORAGE_KEY) loadFromStorage()
  }

  function onCustomChange() {
    loadFromStorage()
  }

  onMounted(() => {
    loadFromStorage()
    window.addEventListener('storage', onStorageChange)
    window.addEventListener('vuewiki-read-change', onCustomChange)
  })

  onUnmounted(() => {
    window.removeEventListener('storage', onStorageChange)
    window.removeEventListener('vuewiki-read-change', onCustomChange)
  })

  return { readCount, isRead, markRead, toggleRead }
}
