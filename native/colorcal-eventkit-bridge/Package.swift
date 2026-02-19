// swift-tools-version: 5.9
import PackageDescription

let package = Package(
  name: "ColorCalBridge",
  platforms: [
    .macOS(.v12)
  ],
  products: [
    .executable(name: "ColorCalBridge", targets: ["ColorCalBridge"])
  ],
  targets: [
    .executableTarget(
      name: "ColorCalBridge",
      path: "Sources/ColorCalBridge"
    )
  ]
)
