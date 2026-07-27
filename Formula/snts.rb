# typed: false
# frozen_string_literal: true

class Snts < Formula
  desc "TypeScript CLI utility for ServiceNow developers using VS Code"
  homepage "https://github.com/stevengregory/sn-typescript-util"
  url "https://registry.npmjs.org/sn-typescript-util/-/sn-typescript-util-1.6.2.tgz"
  sha256 "38aa6b64e53a0a24ba30b58bca81364124ed1c5366864d3714ac70f960c1df01"
  license "MIT"

  livecheck do
    url "https://registry.npmjs.org/sn-typescript-util/latest"
    regex(/["']version["']:\s*?["']([^"']+)["']/i)
  end

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec.glob("bin/*")
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/snts --version")
    assert_match "Build project utility files", shell_output("#{bin}/snts --help")
  end
end
