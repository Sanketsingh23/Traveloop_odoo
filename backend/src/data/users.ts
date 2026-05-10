import bcrypt from 'bcrypt'

export type UserRecord = {
  id: string
  name: string
  email: string
  passwordHash: string
}

const seededPassword = bcrypt.hashSync('TravelLoop@123', 10)

const users: UserRecord[] = [
  {
    id: 'u_001',
    name: 'TravelLoop Demo',
    email: 'demo@travelloop.com',
    passwordHash: seededPassword,
  },
]

export const findUserByEmail = (email: string) => {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase())
}

export const addUser = (user: UserRecord) => {
  users.push({
    ...user,
    email: user.email.toLowerCase(),
  })
}
