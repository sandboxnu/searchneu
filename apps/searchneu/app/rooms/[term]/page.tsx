import { TermSelect } from "@/components/rooms/TermSelect";
import { db, buildingsT, roomsT, termsT } from "@/lib/db";
import { getTerms } from "@/lib/controllers/getTerms";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";

const cachedBuildings = unstable_cache(
  async () => {
    const buildingsWithRooms = await db
      .select({
        buildingId: buildingsT.id,
        buildingName: buildingsT.name,
        roomId: roomsT.id,
        roomNumber: roomsT.code,
      })
      .from(buildingsT)
      .leftJoin(roomsT, eq(roomsT.buildingId, buildingsT.id))
      .orderBy(buildingsT.name, roomsT.code);

    // Group rooms by building
    const groupedData = buildingsWithRooms.reduce(
      (acc, row) => {
        const building = acc.find((b) => b.id === row.buildingId);

        if (building) {
          if (row.roomId && row.roomNumber) {
            building.rooms.push({
              id: row.roomId,
              number: row.roomNumber,
            });
          }
        } else {
          acc.push({
            id: row.buildingId,
            name: row.buildingName,
            rooms:
              row.roomId && row.roomNumber
                ? [
                    {
                      id: row.roomId,
                      number: row.roomNumber,
                    },
                  ]
                : [],
          });
        }

        return acc;
      },
      [] as Array<{
        id: number;
        name: string;
        rooms: Array<{ id: number; number: string }>;
      }>,
    );

    return groupedData;
  },
  ["rooms.buildings"],
  {
    revalidate: 3600,
    tags: ["rooms.buildings"],
  },
);

export default async function RoomsPage({
  params,
}: {
  params: Promise<{ term: string }>;
}) {
  const term = (await params).term;
  const terms = getTerms();
  const buildings = await cachedBuildings();

  return (
    <div className="bg-secondary min-h-[calc(100vh-56px)] px-6 pt-4 pb-4">
      <div className="bg-background mb-4 flex items-center rounded-lg border px-4 py-2">
        <Suspense>
          <TermSelect terms={terms} className="bg-secondary w-72" />
        </Suspense>
      </div>
      <div className="flex flex-wrap gap-1">
        {buildings.map((building) => (
          <div
            key={building.id}
            className="bg-background grow rounded-lg border p-4"
          >
            <h2 className="mb-4 text-lg">{building.name}</h2>
            <div className="flex flex-wrap gap-1">
              {building.rooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/rooms/${term}/${room.id}`}
                  className={`hover:bg-neu2 rounded-lg border px-4 py-2 text-xs font-bold`}
                >
                  {room.number}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
