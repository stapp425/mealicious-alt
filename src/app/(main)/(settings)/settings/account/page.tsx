import { auth } from "@/auth";
import ChangeEmailForm from "@/components/settings/account/change-email-form";
import ChangePasswordForm from "@/components/settings/account/change-password-form";
import ChangeProfilePictureForm from "@/components/settings/account/change-profile-picture-form";
import { ChangeUsernameForm } from "@/components/settings/account/change-username-form";
import { Separator } from "@/components/ui/separator";
import { db } from "@/db";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id: userId } = session.user;

  const foundUser = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
    columns: {
      id: true,
      email: true,
      image: true,
      name: true,
      password: true
    }
  });

  if (!foundUser) redirect("/login");

  const canEdit = !!foundUser.password;
  
  return (
    <div className="grid gap-6">
      <ChangeProfilePictureForm
        key={foundUser.image}
        id={foundUser.id}
        avatarImageUrl={foundUser.image}
      />
      <Separator />
      <ChangeUsernameForm 
        key={foundUser.name}
        username={foundUser.name}
      />
      <Separator />
      <ChangeEmailForm 
        key={foundUser.email}
        email={foundUser.email}
        canEdit={canEdit}
      />
      <Separator />
      <ChangePasswordForm 
        key={foundUser.password}
        canEdit={canEdit}
      />
    </div>
  );
}
