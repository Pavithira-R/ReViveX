import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using bcrypt.
 * @param password Plaintext password
 * @returns Hashed password string
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plaintext password with a hashed password.
 * @param password Plaintext password
 * @param hash Hashed password from database
 * @returns boolean indicating if password matches
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
