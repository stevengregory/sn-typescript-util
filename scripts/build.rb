#!/usr/bin/env ruby

require 'json'

module ServiceNow
  class Build
    def get_project_name
      file_path = File.read('system/sn-workspace.json')
      JSON.parse(file_path)['ACTIVE_APPLICATION']
    end

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
      replace_content config
    end

    def replace_content(item)
      File.write(item, File.open(item, &:read).gsub('@project', get_project_name))
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
