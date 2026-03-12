/**
 * tracker domain types - shared between server and client
 *
 * this file contains pure TypeScript interfaces for all tracker entities.
 * It has NO server-only imports and is safe to use in client components,
 * API route response types, and server-side DAL code
 *
 * DAL functions return these types; API routes serialize them as JSON;
 * client components use them to type fetched data
 */
