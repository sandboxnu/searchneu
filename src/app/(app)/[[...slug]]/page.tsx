import { notFound } from 'next/navigation'

// NOTE: this and the slug folder will cause npm run dev to not work. delete/move out of (app) remporarily to solve.
export default function CatchAll() {
  notFound()
}