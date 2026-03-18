"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookText } from "lucide-react";
import { useAuthUser } from "@/src/hooks/useAuthUser";

interface UserClass {
  id: string;
  name: string;
}

export function MyClassesNav() {
  const { user } = useAuthUser();
  const [classes, setClasses] = useState<UserClass[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => setClasses(data.items || []));
  }, [user]);

  if (!user) return null;

  return (
    <>
      <Link
        href="/my-classes"
        className="nav-link text-white flex items-center gap-2"
      >
        <BookText size={18} />
        My Classes
      </Link>
      {classes.length > 0 && (
        <div className="pl-8 mt-2 space-y-1">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/my-classes/${c.id}`}
              className="text-xs text-violet-300 hover:text-violet-100 block"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
