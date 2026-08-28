import { Link } from "@tanstack/react-router";
import { ImageOff, MapPin, Building2 } from "lucide-react";
import type { BrowseProfile } from "@/lib/browse";
import { ageBand } from "@/lib/browse";
import { Badge } from "@/components/ui/badge";

type Props = {
  profile: BrowseProfile;
  photoUrl?: string | undefined;
};

export function ProfileCard({ profile, photoUrl }: Props) {
  const location = [profile.city, profile.country].filter(Boolean).join(", ");

  return (
    <Link
      to="/member/$profileId"
      params={{ profileId: profile.id }}
      search={{ from: "/browse" }}
      className="surface-card group flex flex-col overflow-hidden rounded-xl border border-border transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`Photograph shared publicly by ${profile.display_name ?? "this member"}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary/15 px-4 text-center">
            <ImageOff className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">
              {profile.has_hidden_photo
                ? "Photograph shared only after a match"
                : "No photograph shared"}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-h3 text-foreground">{profile.display_name ?? "Member"}</h3>
          <p className="text-sm text-muted-foreground">{ageBand(profile.age)}</p>
        </div>

        <dl className="space-y-1.5 text-sm text-foreground">
          {location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
              <span>{location}</span>
            </div>
          )}
          {profile.mosque_name && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
              <span className="text-muted-foreground">{profile.mosque_name}</span>
            </div>
          )}
          {profile.profession && <p className="text-muted-foreground">{profile.profession}</p>}
        </dl>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {profile.marital_status && <Badge variant="secondary">{profile.marital_status}</Badge>}
          {profile.religious_practice_level && (
            <Badge variant="outline">{profile.religious_practice_level}</Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
