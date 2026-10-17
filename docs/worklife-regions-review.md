# Regional counts review

Review date: 17 October 2026. No `AGENTS.md` is present in this repository. Nothing was committed, pushed, merged, or deployed. GitHub Actions was not re-run, and the live GitHub Pages site was not opened.

## Environments

| Environment | What it was used for | Result |
| --- | --- | --- |
| Windows, Python 3, Node, .NET SDK 10.0.103 only | Source audit, frontend tests, production build, static artifact server | Used |
| WSL Ubuntu package .NET SDK 8.0.131 | First backend test attempt | Testhost failed before any test ran. Its `testhost.deps.json` asks for `NuGet.Frameworks` 6.8.2-rc.32767 at `lib/net8.0`, and that path is not in the package layout |
| Official Microsoft .NET SDK 8.0.426, installed with `dotnet-install.sh` into `/home/karine/dotnet-sdk-8` | Backend tests and the temporary observation API | Used. `DOTNET_ROOT` pointed at this SDK |
| Docker | Not used | The Docker engine was not running (`npipe:////./pipe/dockerDesktopLinuxEngine` was missing), and `sudo` in WSL requires a password |

The pinned archive was the local file `C:\Users\karin\AppData\Local\Temp\occ-diseases-inspect\occupational-diseases-data-20052026.zip`. Its checksum was checked again. The file was not replaced.

## Fixes made during this review

1. **Public entry.** `frontend/index.html` now sends visitors to `worklife-regions.html`. The regional page links to the README installation section instead of presenting the observation application as a hosted demo. The observation application remains at `frontend/observations.html` for local use with the API. If that page cannot reach the API, it says so and links to the same installation section.
2. **Test host.** `global.json` keeps the SDK on the 8.0 feature band (`8.0.100`, `rollForward: latestFeature`). The test project now references `Microsoft.NET.Test.Sdk` 17.11.1 directly. The backend workflow installs `8.0.x` and reads `global.json`. This is the response to the GitHub Actions failure in which `dotnet test` launched testhost `18.7.0-release-26423-113` and could not find `Microsoft.TestPlatform.CommunicationUtilities.dll`.
3. **Created-resource URL.** `POST /api/observations` returned `Location: http://localhost/api/Observations/15` on the Linux test host. The route is now the documented `api/observations`, so the header matches the frontend and the existing test.

The Node.js 20 warning on `actions/checkout@v4` and `actions/setup-dotnet@v4` was visible in the Actions log. It is a runner compatibility notice, not the test failure. The action major versions were left unchanged.

## Source verification

Command, without `--write`:

```bash
python scripts/verify_worklife_regions.py --zip C:\Users\karin\AppData\Local\Temp\occ-diseases-inspect\occupational-diseases-data-20052026.zip
```

Result: `Derived assets match the committed files.` Exit 0.

A 9-byte stand-in for the archive exited 1 with the pinned size and SHA-256 mismatch. The message said the committed assets were left unchanged. The checksum in the script was not edited.

Independent read of the same archive and of `frontend/public/worklife/counts.json`:

| Check | Result |
| --- | --- |
| Archive size and SHA-256 | 292,234 bytes, `ad2261e1bcc95b68d852e96e7718b740ee5bbcb3a15c70d6e6d5fd80ece5713f` |
| File C header | `MAAKUNTAK`, `VAHVVUOSI` |
| Data rows | 6,669 |
| Distinct region–year pairs | 90 |
| Sum of pair counts | 6,669, so repeated rows are kept and the numeric join does not drop or multiply rows |
| Åland rows in file C | 0 |
| Stored zero pairs | 0 |
| Years | 2019–2023 |
| Codes in file C | 1, 2, 4–19 |
| Committed cells | 90 `published`, 5 `outside_scope`, 5 null counts, published sum 6,669, 19 regions |
| `absent` or `confirmed_zero` in the committed file | none |

The status distinction itself is in `frontend/src/worklife/model.ts` and `model.test.ts`: an all-absent fixture stays `absent`, an all-`outside_scope` fixture stays `outside_scope`, and `confirmed_zero` adds 0. The real archive does not emit `confirmed_zero`.

## Backend and observation application

Command, from the official SDK:

```bash
export DOTNET_ROOT=/home/karine/dotnet-sdk-8
export PATH="$DOTNET_ROOT:$PATH"
export DOTNET_MULTILEVEL_LOOKUP=0
dotnet test backend/GeoSampleExplorer.sln -c Release --nologo
```

`dotnet --version` printed `8.0.426`. After the route fix: **7 passed, 0 failed.**

The API was then started with that SDK on `http://127.0.0.1:5000` and a temporary database, `/tmp/review-geosample.db`. The Vite dev server proxied `/api` from `http://127.0.0.1:5173/GeoSample-Explorer/`. These checks used that API, not a mocked frontend response.

| Check | Result |
| --- | --- |
| Observations load | 14 seeded observations |
| Point markers | 14 Leaflet markers |
| Type `Soil` | List and map shrink to the four Soil observations. Region options still include Central, East, North, South, and West |
| `Soil` plus `South` | Empty list, zero markers. Both selects still show `Soil` and `South`, and both option lists stay complete |
| Name search `Berlin` | One observation, `Berlin Soil Sample`, one marker. Type options stay complete |
| API `type=So` | 0 rows |
| API `type=Soil` | 4 rows, all type Soil |
| API `region=Nor` | 0 rows |
| API `region=North` | 4 rows |
| Create | `ReviewType` / `ReviewRegion` appeared in the dropdowns |
| Update | The type became `ReviewTypeUpdated`; `ReviewType` left the dropdown |
| Delete | The row, both new options, and the extra marker disappeared. 14 markers remained |

## Publication artifact

`npm test` in `frontend`: 2 files, 12 tests, passed. `npm run build` succeeded.

The artifact was copied to a directory named `GeoSample-Explorer` and served with Python’s static server, not the Vite dev server:

```bash
cd frontend
npm test
npm run build
```

Then serve the parent of that `GeoSample-Explorer` directory and open `http://127.0.0.1:4173/GeoSample-Explorer/`.

Checked on that static server:

- `/GeoSample-Explorer/` landed on `worklife-regions.html?year=all`.
- Data requests were `/GeoSample-Explorer/worklife/counts.json` and `regions.geojson`. There was no `/api` request.
- The header links to `https://github.com/karinehei/GeoSample-Explorer#installation--run`.
- CC BY 4.0 and the MIT geometry notice are in the source panel. OpenStreetMap attribution is on the map.
- The boundary sentence is beside the map.
- Choosing 2019 changed the legend to “Vuoden julkaistut tapaukset” and reordered the table. Back restored `year=all`, the five-year legend, and Uusimaa 1,691.
- Reloading `worklife-regions.html?year=2019&region=8` selected Kymenlaakso, showed 8 in the table, and charted 8, 16, 49, 62, 13.
- At a 390px width the page stacks vertically. The year and region controls and the table remain readable.
- Year and region controls and the region-name buttons are focusable. The automated Tab key did not move focus, because that tool sends an untrusted key event. The map polygons are pointer targets; the select and the table select the same region.
- Artifact files are the three HTML entries, the JS/CSS assets, `counts.json`, `regions.geojson`, and the two geometry text files. No case file and no zip archive is in the artifact. `counts.json` names the source file; it does not contain the case rows.

## Readiness

The regional page is ready to show as a job-application work sample of a static, sourced, read-only view: counts rather than rates, Åland distinguished from a missing cell, a fixed colour scale, and a stated boundary limitation. The observation application remains a separate local example and is no longer the public entry.

It is not a published site yet. The Actions log supplied during the review showed the backend test job failing, and this review did not re-run Actions after the fix.

### Checks that passed

- Pinned archive matches the committed aggregates, and a different file is rejected before any write.
- File C has 6,669 rows; the pair counts sum to 6,669; Åland is `outside_scope` with null counts; the committed file has no `confirmed_zero`.
- Frontend tests: 12 passed. Production build succeeded.
- Backend tests on official SDK 8.0.426: 7 passed.
- Observation UI against that API: markers, stable dropdowns, empty-result selections, exact type and region filters, name search, and catalog refresh after create, update, and delete.
- Static artifact under `/GeoSample-Explorer/`: redirect into the regional view, no API call, shared URL reload, Back, attribution, and the boundary note.

### Checks still unverified

- GitHub Actions after these fixes. The recorded run failed on testhost 18.7.0. The local official SDK passes. The live workflow has not been run again.
- The live site `https://karinehei.github.io/GeoSample-Explorer/`. It was not deployed.
- A full keyboard pass of the map polygons. Equivalent selection is on the region control and the table buttons.
- Docker as a second SDK environment. The engine was not running.

### Production preview

```bash
cd frontend
npm test
npm run build
```

Copy `frontend/dist` to a folder named `GeoSample-Explorer`, serve the parent directory, and open `/GeoSample-Explorer/`. For the observation example, start the .NET 8 API and open `/GeoSample-Explorer/observations.html` from `npm run dev`.

### Remaining publication steps

1. Commit the review fixes, including `global.json` and the public entry.
2. In the repository settings, set Pages to GitHub Actions.
3. Confirm the backend workflow passes on the pinned .NET 8 SDK.
4. Run `.github/workflows/pages.yml` manually. It uploads `frontend/dist` only.
5. Open `https://karinehei.github.io/GeoSample-Explorer/` and confirm it lands on the regional page.

Do not treat those steps as done. They were not run in this review.
