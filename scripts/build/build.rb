#!/usr/bin/env ruby

require_relative File.join(__dir__, './../utils/utils')

module ServiceNow
  class Build
    def initialize
      @app = ServiceNow::Utils.new.get_application
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

    def get_config_types
      [
        '.prettierrc',
        '.prettierrc.json',
        '.prettierrc.yml',
        '.prettierrc.yaml',
        '.prettierrc.json5',
        '.prettierrc.js',
        '.prettierrc.cjs',
        'prettier.config.js',
        'prettier.config.cjs',
        '.prettierrc.toml'
      ]
    end

    def has_prettier_config
      get_config_types.any? do |item|
        ServiceNow::Utils.new.has_file item
      end
    end

    def init
      make_configs
    end

    def make_configs
      create_tsconfig
      if has_prettier_config === false
        create_prettier_config
      end
    end

    def transpile
      %x( tsc )
    end
  end
end
