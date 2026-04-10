use std::sync::Mutex;
use tauri::State;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn mobile_main() {
    run();
}

struct AppState {
    has_orders: Mutex<bool>,
}

#[tauri::command]
fn set_has_orders(state: State<AppState>, has_orders: bool) {
    *state.has_orders.lock().unwrap() = has_orders;
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            has_orders: Mutex::new(false),
        })
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![set_has_orders])
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri::menu::{Menu, MenuItem};
                use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
                use tauri_plugin_autostart::ManagerExt;

                app.handle().plugin(tauri_plugin_autostart::init(
                    tauri_plugin_autostart::MacosLauncher::LaunchAgent,
                    Some(vec!["--autostart"]),
                ))?;

                let autolaunch = app.autolaunch();
                if !autolaunch.is_enabled().unwrap_or(false) {
                    let _ = autolaunch.enable();
                }

                let show_item = MenuItem::with_id(app, "show", "Abrir", true, None::<&str>)?;
                let quit_item = MenuItem::with_id(app, "quit", "Salir", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

                let mut tray_builder = TrayIconBuilder::new()
                    .menu(&menu)
                    .tooltip("Xquisito Crew");

                if let Some(icon) = app.default_window_icon() {
                    tray_builder = tray_builder.icon(icon.clone());
                }

                let tray = tray_builder
                    .on_menu_event(|app, event| match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => app.exit(0),
                        _ => {}
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } = event
                        {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                if window.is_visible().unwrap_or(false)
                                    && !window.is_minimized().unwrap_or(true)
                                {
                                    let _ = window.minimize();
                                } else {
                                    let _ = window.show();
                                    let _ = window.unminimize();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                    })
                    .build(app)?;

                let _ = tray;
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            #[cfg(desktop)]
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let state = window.state::<AppState>();
                let has_orders = *state.has_orders.lock().unwrap();
                if has_orders {
                    let _ = window.minimize();
                } else {
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
