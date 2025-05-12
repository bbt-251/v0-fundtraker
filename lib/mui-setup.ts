// This file sets up the MUI theme and emotion cache for the application
import { createTheme } from "@mui/material/styles"
import createCache from "@emotion/cache"

// Create a theme instance
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3f51b5",
    },
    secondary: {
      main: "#f50057",
    },
  },
})

// Create an emotion cache
export function createEmotionCache() {
  return createCache({ key: "css", prepend: true })
}
