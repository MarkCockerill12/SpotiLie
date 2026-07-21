fn main() {
    println!("cargo:rerun-if-changed=../src/injector.js");
    tauri_build::build();
}
