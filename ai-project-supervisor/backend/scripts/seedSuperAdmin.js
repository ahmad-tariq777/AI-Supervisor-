import { connectDb, disconnectDb } from '../src/config/db.js';
import { ROLES } from '../src/shared/constants/roles.js';
import { hashPassword } from '../src/shared/utils/password.js';
import { User } from '../src/modules/users/user.model.js';
import {
  emailSchema,
  fullNameSchema,
  newPasswordSchema
} from '../src/modules/auth/auth.validators.js';

function readInput() {
  const name = process.env.SUPER_ADMIN_NAME?.trim() || 'Super Admin';
  const email = process.env.SUPER_ADMIN_EMAIL?.trim();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  const problems = [];
  const parsedName = fullNameSchema.safeParse(name);
  const parsedEmail = emailSchema.safeParse(email);
  const parsedPassword = newPasswordSchema.safeParse(password);

  if (!parsedName.success) problems.push(`SUPER_ADMIN_NAME: ${parsedName.error.issues[0].message}`);
  if (!parsedEmail.success) problems.push(`SUPER_ADMIN_EMAIL: ${parsedEmail.error.issues[0].message}`);
  if (!parsedPassword.success) {
    problems.push(`SUPER_ADMIN_PASSWORD: ${parsedPassword.error.issues[0].message}`);
  }

  if (problems.length > 0) return { problems };
  return {
    values: {
      fullName: parsedName.data,
      email: parsedEmail.data,
      password: parsedPassword.data
    }
  };
}

async function main() {
  const { values, problems } = readInput();
  if (problems) {
    process.stderr.write(`Cannot create the Super Admin:\n${problems.map((p) => `  - ${p}`).join('\n')}\n`);
    return 1;
  }

  await connectDb();

  const existing = await User.findOne({ role: ROLES.SUPER_ADMIN }).select('email');
  if (existing) {
    process.stdout.write(`A Super Admin already exists (${existing.email}). Nothing was changed.\n`);
    return 0;
  }

  const emailTaken = await User.exists({ email: values.email });
  if (emailTaken) {
    process.stderr.write(`The email ${values.email} is already used by another account.\n`);
    return 1;
  }

  const passwordHash = await hashPassword(values.password);
  await User.create({
    fullName: values.fullName,
    email: values.email,
    passwordHash,
    role: ROLES.SUPER_ADMIN
  });

  process.stdout.write(`Super Admin created: ${values.email}\n`);
  return 0;
}

main()
  .then(async (code) => {
    await disconnectDb();
    process.exit(code);
  })
  .catch(async (err) => {
    process.stderr.write(`Seeding failed: ${err.message}\n`);
    await disconnectDb().catch(() => {});
    process.exit(1);
  });
