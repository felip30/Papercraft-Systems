@echo off
echo ========================================================
echo Ejecutando 6 Commits y 6 Pushes en la rama testAllexec
echo ========================================================

:: 1. Commit 1: Plan de pruebas
git add PLAN_DE_PRUEBAS.md
git commit -m "docs: adaptar plan de pruebas a PaperCraft Systems"
git push origin testAllexec

:: 2. Commit 2: Infraestructura de testing (package.json, vitest, setup, gitignore)
git add package.json vitest.config.js tests/setup.js .gitignore
git commit -m "test: configurar entorno de pruebas unitarias con Vitest y JSDOM"
git push origin testAllexec

:: 3. Commit 3: Pruebas unitarias (currency, auth, dataManager, games)
git add tests/unit/currency.test.js tests/unit/auth.test.js tests/unit/dataManager.test.js tests/unit/games.test.js
git commit -m "test(unit): agregar pruebas unitarias para currency, auth, dataManager y juegos"
git push origin testAllexec

:: 4. Commit 4: Pruebas E2E y capturas de pantalla con Playwright
git add playwright.config.js tests/e2e/navigation_and_shop.spec.js
git commit -m "test(e2e): configurar Playwright con capturas de pantalla automáticas"
git push origin testAllexec

:: 5. Commit 5: Pruebas de carga k6 (100 VUs y reporte HTML)
git add tests/load/k6_load_test.js
git commit -m "test(load): incorporar pruebas de carga k6 para 100 VUs y reportes HTML graficos"
git push origin testAllexec

:: 6. Commit 6: Instrucciones finales de ejecucion de pruebas
git add instruccionesTest.md
git commit -m "docs: agregar instruccionesTest.md con la guia completa de comandos"
git push origin testAllexec

echo ========================================================
echo ¡Los 6 commits y 6 pushes han sido enviados a testAllexec!
echo ========================================================
