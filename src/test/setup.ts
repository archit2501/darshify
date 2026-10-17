import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";

// Route-level tests render the full provider tree; on a busy machine the
// default 1 s wait for async UI is too tight and produces false failures.
configure({ asyncUtilTimeout: 5000 });
