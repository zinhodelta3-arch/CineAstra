import ProfilesClient from "@/components/streaming/profiles/ProfilesClient";

export const metadata = {
  title: "Quem vai assistir? | CineAstra",
  description: "Escolha seu perfil e encontre sua próxima história no CineAstra.",
};

export default function StreamingProfilesPage() {
  return <ProfilesClient />;
}
