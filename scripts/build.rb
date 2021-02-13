#!/usr/bin/env ruby

require_relative File.join(__dir__, 'utils')

module ServiceNow
  class Build
    def install_packages
      %x( npm i @types/servicenow @types/node commander npm-add-script nodemon prettier typescript ts-node -g )
      %x( npm i @types/servicenow @types/node commander nodemon prettier ts-node typescript -D )
    end

    def make_prettier_config
      config = '.prettierrc.json'
      file_path = File.read(File.join(File.expand_path('..', __dir__), "templates/#{config}"))
      File.write(config, file_path)
    end

    def make_tsconfig_file
      config = 'tsconfig.json'
      file_path = File.read(File.join(File.expand_path('..', __dir__), "templates/#{config}"))
      File.write(config, file_path)
      ServiceNow::Utils.new.replace_content config
    end

    def update_package_scripts
      %x( npmAddScript -k start -v "npm run snt:watch" )
      %x( npmAddScript -k snt:watch -v "nodemon --watch 'ts/**/*.ts' --exec 'snt -c' -e ts" )
    end

    def create
      install_packages
      update_package_scripts
      make_prettier_config
      make_tsconfig_file
    end
  end
end
