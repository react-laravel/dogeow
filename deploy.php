<?php

// Retired localhost/PM2 recipe: the Next frontend now runs on server C.
// PHP API/database/Redis remain on A and must not be moved by this recipe.
fwrite(STDERR, "Deployment moved to server C. Use the GitHub workflow or bash scripts/deploy-to-c.sh after packaging.\n");
exit(1);
