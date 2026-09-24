// Temporary compile-only entry. The original application remains in quamolit.app.main/main!.
import { main_$x_ } from "./target/js/app/quamolit.bootstrap.mjs"

main_$x_()

if (import.meta.hot) {
  import.meta.hot.accept('./target/js/app/quamolit.bootstrap.mjs', (main) => {
    main.reload_$x_()
  })
}
