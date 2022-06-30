# Commit Message Guidelines

Here are the 7 steps for a good git commit message, as per [Chris Beam's blog](https://chris.beams.io/posts/git-commit/)

1. Separate subject from body with a blank line
2. Limit the subject line to 50 characters
3. Capitalize the subject line
4. Do not end the subject line with a period
5. Use the imperative mood in the subject line
6. Wrap the body at 72 characters
7. Use the body to explain what and why vs. how

### Examples: <!-- {docsify-ignore} -->

_Fix failing CompositePropertySourceTests_<br>
_Rework @PropertySource early parsing logic_<br>
_Add tests for ImportSelector meta-data_<br>
_Update docbook dependency and generate epub_<br>
_Polish mockito usage_<br>

# Squashing Pull Requests

As a team, we've agreed to squash all of our pull requests for this project. The reason is because it will make our logs generally much cleaner and more concise. With the PR template, most code changes should be explained enough by the PR message, and smaller PR's will also keep this more in line.
