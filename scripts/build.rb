#!/usr/bin/env ruby

require_relative File.join(__dir__, 'utils')

module ServiceNow
  class Build
    def add_packages
      %x( npm i @types/servicenow @types/node commander npm-add-script nodemon prettier typescript ts-node -g )
      %x( npm i @types/servicenow @types/node commander nodemon prettier ts-node typescript -D )
    end

    def add_package_scripts
      %x( npmAddScript -k start -v "npm run snt:watch" )
      %x( npmAddScript -k snt:watch -v "nodemon --watch 'ts/**/*.ts' --exec 'snt -c' -e ts" )
    end

    def create_prettier_config
      config = '.prettierrc.json'
      file = ServiceNow::Utils.new.fetch_file 'templates', config
      File.write(config, file)
    end

    def create_tsconfig
      config = 'tsconfig.json'
      file = ServiceNow::Utils.new.fetch_file 'templates', config
      File.write(config, file)
      ServiceNow::Utils.new.replace_content config
    end

    def init
      add_packages
      add_package_scripts
      create_prettier_config
      create_tsconfig
    end

    def transpile
      src_path = "#{ServiceNow::Utils.new.get_project}/src"
      %x( tsc )
      %x( prettier --write "dist/**/*.js" )
      %x( rsync -av --progress -a --exclude="Interfaces" "dist/" "#{src_path}" )
    end
  end
end
