export function publicUser(user) {
  return {
    id: String(user.id ?? user._id),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    profile: { skills: [...(user.profile?.skills ?? [])] }
  };
}
