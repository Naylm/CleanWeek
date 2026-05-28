const getDemoProfiles = (userId) => {
  const baseProfiles = [
    { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', display_name: 'Laura', avatar_color: '#FF6584' },
    { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', display_name: 'Melvin', avatar_color: '#6C63FF' }
  ]
  return { allProfiles: baseProfiles, profile: baseProfiles.find(p => p.id === userId) || baseProfiles[0] }
}

export function useProfile(userId) {
  const demoData = userId ? getDemoProfiles(userId) : { allProfiles: [], profile: null }
  return { profile: demoData.profile, allProfiles: demoData.allProfiles, loading: false, isOffline: true, updateProfile: () => true }
}
