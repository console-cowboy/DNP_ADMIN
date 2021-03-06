import { stringSplit, stringIncludes } from "./strings";

const githubBaseUrl = "https://github.com/";

/**
 * Gets the repo slug from a manifest, using the repository property
 *
 * @param {object} manifest
 * @returns {string} repoSlug = "dappnode/DNP_ADMIN"
 */
function getRepoSlugFromManifest(manifest = {}) {
  const { type, url } = manifest.repository || {};
  // Ignore faulty manifests
  if (type !== "git" || !stringIncludes(url, githubBaseUrl)) return;
  // Get repo slug from the repoUrl, i.e. "https://github.com/dappnode/DNP_VPN"
  const repoSlug = stringSplit(url, githubBaseUrl)[1];
  return (repoSlug || "").replace(/\/+$/, "").replace(".git", "");
}

export default getRepoSlugFromManifest;
