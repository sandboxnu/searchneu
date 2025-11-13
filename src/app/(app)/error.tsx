"use client";

import {useEffect} from "react"
import {logger} from "@/lib/logger"

export default function Error({
  error,
} : {error: Error & {digest?: string}
}) {
  useEffect(() => {
    logger.error(error)
  }, [error])

  return <p>Something broke DDD:</p>;
}