/**
 * Describes the term SearchNEU uses for each of Northeastern's NUPath academic
 * breadth requirements.
 */
export enum NUPathEnum {
    ND = "Natural/Designed World",
    EI = "Creative Express/Innov",
    IC = "Interpreting Cusclture",
    FQ = "Formal/Quant Reasoning",
    SI = "Societies/Institutions",
    AD = "Analyzing/Using Data",
    DD = "Difference/Diversity",
    ER = "Ethical Reasoning",
    WF = "1st Yr Writing",
    WD = "Adv Writ Dscpl",
    WI = "Writing Intensive",
    EX = "Integration Experience",
    CE = "Capstone Experience",
}

/**
 * Represents one of the seasons in which a student can take a course, as
 * abbreviated by Northeastern.
 */
export enum SeasonEnum {
    FL = "FL",
    SP = "SP",
    S1 = "S1",
    S2 = "S2",
    SM = "SM",
}

/** A Status is one of on CO-OP, CLASSES, or INACTIVE */
export enum StatusEnum {
    COOP = "COOP",
    CLASSES = "CLASSES",
    INACTIVE = "INACTIVE",
    HOVERINACTIVE = "HOVERINACTIVE",
    HOVERCOOP = "HOVERCOOP",
}

/** A SearchNEU prerequisite object. */
export type INEUReq = INEUAndReq | INEUOrReq | INEUReqCourse;

/**
 * A SearchNEU prerequisite course.
 *
 * @param classId The course number of this prerequisite course.
 * @param subject The subject of this prerequisite course.
 * @param missing True if the class is missing.
 */
export interface INEUReqCourse {
    classId: string;
    subject: string;
    missing?: true;
}

/**
 * A SearchNEU AND prerequisite object.
 *
 * @param type   The type of the SearchNEU prerequisite.
 * @param values The prerequisites that must be completed for this prereq. to be
 *   marked as done.
 */
export interface INEUAndReq {
    type: "and";
    values: INEUReq[];
}

/**
 * A SearchNEU OR prerequisite object.
 *
 * @param type   The type of the SearchNEU prerequisite.
 * @param values The prerequisites of which one must be completed for this
 *   prerequisite to be marked as done.
 */
export interface INEUOrReq {
    type: "or";
    values: INEUReq[];
}

/**
 * A course within a schedule used by of the App. A generic id field is used for
 * book keeping purposes by the drag and drop library, in cases where we don't
 * care about this id, T can null.
 *
 * @param name          The name of the course
 * @param classId       The classId of this course (1210, 1800, etc)
 * @param subject       The subject of this course (CS, DS, etc)
 * @param prereqs       The prerequisites for this course
 * @param coreqs        The corequisites for this course
 * @param nupaths       The nupaths this course fulfills
 * @param numCreditsMin The minimum number of credits this course gives
 * @param numCreditsMax The maximum number of credits this course gives
 * @param id            Unique id used as a book keeping field for dnd.
 */
export interface ScheduleCourse<T> {
    name: string;
    classId: string;
    subject: string;
    prereqs?: INEUAndReq | INEUOrReq;
    coreqs?: INEUAndReq | INEUOrReq;
    nupaths?: NUPathEnum[];
    numCreditsMin: number;
    numCreditsMax: number;
    id: T;
    generic?: boolean;
}

/**
 * A clean version of the ScheduleTerm used by of the App. A generic id field is
 * used for book keeping purposes by the drag and drop library, in cases where
 * we don't care about this id, T can null.
 *
 * @param year    The year of this term
 * @param season  The season of this term
 * @param status  The status of this term, on coop, classes, or inactive.
 * @param classes A list of the classes of this term.
 * @param id      Unique id used as a book keeping field for dnd.
 */
export interface ScheduleTerm<T> {
    season: SeasonEnum;
    status: StatusEnum;
    classes: ScheduleCourse<T>[];
    id: T;
}

/**
 * A ScheduleYear, representing a year of a schedule
 *
 * @param year         The academic year number(1, 2, 3...) not to be confused
 *   with the calendar year. One academic year spans from [Calendar Year X,
 *   Fall] - [Calendar Year X + 1, Summer 2].
 *
 *   Storing the academic year num isn't necessary but can be nice since it
 *   prevents us from relying on the order in which ScheduleYears are stored in
 *   a Schedule.
 * @param fall         The fall term
 * @param spring       The spring term
 * @param summer1      The summer 1 term
 * @param summer2      The summer 2 term
 * @param isSummerFull True if the summer1 should hold the classes for summer full.
 */
export interface ScheduleYear<T> {
    year: number;
    fall: ScheduleTerm<T>;
    spring: ScheduleTerm<T>;
    summer1: ScheduleTerm<T>;
    summer2: ScheduleTerm<T>;
    isSummerFull: boolean;
}

/**
 * A clean version of a student's schedule as used in of the App with no
 * redundunt year information.
 *
 * @param years A list of the years of this object
 */
export interface Schedule<T> {
    years: ScheduleYear<T>[];
}