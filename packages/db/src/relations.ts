import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  user: {
    session: r.many.session(),
    account: r.many.account(),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },
  savedPlansT: {
    savedPlanCoursesT: r.many.savedPlanCoursesT(),
  },
  savedPlanCoursesT: {
    savedPlansT: r.one.savedPlansT({
      from: r.savedPlanCoursesT.planId,
      to: r.savedPlansT.id,
    }),
    sections: r.many.savedPlanSectionsT(),
  },
  savedPlanSectionsT: {
    course: r.one.savedPlanCoursesT({
      from: r.savedPlanSectionsT.savedPlanCourseId,
      to: r.savedPlanCoursesT.id,
    }),
  },
}));
