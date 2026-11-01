// @license magnet:?xt=urn:btih:e95b018ef3580986a04669f1b5879592219e2a7a&dn=public-domain.txt PublicDomain

/*
Isotope Gallery Script =^w^=

This file is dedicated to the public domain.
No rights reserved.
*/

const repo = "mahyar132/art";
const folder = "artwork";
const types = /\.(jpe?g|png|webp|gif|avif|svg|bmp|ico)$/i;

const gallery = document.getElementById("gallery");
const status = document.getElementById("status");

function getDate(filename) {
    const match = filename.match(/(?:^|[^0-9])(\d{4})-(\d{2})-(\d{2})(?=[^0-9]|$)/);

    if (!match) return null;

    const [, year, month, day] = match;
    const date = new Date(Date.UTC(+year, +month - 1, +day));

    if (date.getUTCFullYear() !== +year || date.getUTCMonth() !== +month - 1 || date.getUTCDate() !== +day) {
        return null;
    }

    return date.getTime();
}

if (!gallery || !status) {
    console.error("Gallery requires #gallery and #status elements.");
} else {
    fetch(`https://api.github.com/repos/${repo}/git/trees/HEAD?recursive=1`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`GitHub API request failed: HTTP ${response.status}`);
            }

            return response.json();
        })
        .then((data) => {
            if (!Array.isArray(data.tree)) {
                throw new Error("Invalid GitHub API response.");
            }

            if (data.truncated) {
                throw new Error("GitHub returned an incomplete file tree.");
            }

            const files = data.tree.filter(
                (file) => file.type === "blob" && file.path.startsWith(`${folder}/`) && types.test(file.path)
            );

            files.sort((a, b) => {
                const nameA = a.path.split("/").pop();
                const nameB = b.path.split("/").pop();

                const dateA = getDate(nameA);
                const dateB = getDate(nameB);

                // Dated files first, newest date first.
                if (dateA !== null && dateB !== null && dateA !== dateB) {
                    return dateB - dateA;
                }

                if (dateA !== null && dateB === null) return -1;
                if (dateA === null && dateB !== null) return 1;

                // Same date, or no date: sort by filename.
                return nameA.localeCompare(nameB, undefined, {
                    numeric: true,
                    sensitivity: "base",
                });
            });

            if (files.length === 0) {
                status.textContent = "No artwork found in the artwork folder.";
                return;
            }

            status.textContent = `${files.length} artwork${files.length === 1 ? "" : "s"}`;

            const fragment = document.createDocumentFragment();

            files.forEach((file) => {
                const name = file.path.split("/").pop();

                const encodedPath = file.path
                    .split("/")
                    .map((part) => encodeURIComponent(part))
                    .join("/");

                const url = `https://raw.githubusercontent.com/${repo}/HEAD/${encodedPath}`;

                const link = document.createElement("a");
                link.className = "item";
                link.href = url;
                link.target = "_blank";
                link.rel = "noopener";
                link.download = name;
                link.setAttribute("aria-label", `Open ${name}`);

                const img = document.createElement("img");
                img.src = url;
                img.alt = name;
                img.loading = "lazy";
                img.decoding = "async";

                link.appendChild(img);
                fragment.appendChild(link);
            });

            gallery.replaceChildren(fragment);
        })
        .catch((error) => {
            console.error("Gallery loading failed:", error);

            status.textContent = "Unable to load artwork. Please check your connection or try again later.";
        });
}

// @license-end
