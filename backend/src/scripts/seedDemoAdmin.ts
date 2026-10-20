import connectDB from "../app/config/db";
import User from "../app/modules/Auth/user.model";

const DEMO_EMAIL = (process.env.DEMO_ADMIN_EMAIL || "demo.admin@yma.test").toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_ADMIN_PASSWORD;

async function run() {
  // Never seed a privileged account with a password that lives in the repo.
  // Set DEMO_ADMIN_PASSWORD to a long, unique value before running this.
  if (!DEMO_PASSWORD || DEMO_PASSWORD.length < 16) {
    throw new Error(
      "DEMO_ADMIN_PASSWORD must be set to at least 16 characters before seeding a demo admin.",
    );
  }

  await connectDB();

  let user = await User.findOne({ email: DEMO_EMAIL }).select("+password");
  if (!user) {
    user = await User.create({
      name: "Demo Admin",
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      role: "admin",
      active: true,
      isEmailVerified: true,
    });
    console.log(`Created demo admin ${DEMO_EMAIL}`);
  } else {
    user.role = "admin";
    user.active = true;
    user.isEmailVerified = true;
    user.password = DEMO_PASSWORD;
    await user.save();
    console.log(`Updated demo admin ${DEMO_EMAIL}`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
