---
title: Introduction
description: Introduction to the SearchNEU Authenication API
icon: Rocket
---

SearchNEU uses [Better Auth](https://better-auth.com/) for authenication. This
section documents the API provided by Better Auth an its respective plugins to
be used as reference. Third party projects should be directly implement this API
(with most endpoints will return a `403` Not Authorized).

This schema is generated from the `/api/auth/open-api/generate-schema` endpoint
and should be periodically re-generated to ensure up-to-date information.
