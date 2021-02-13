#!/usr/bin/env ruby

require 'fileutils'
require 'json'

module ServiceNow
  class Utils
    def clean_build(dir)
      FileUtils.rm_rf(dir)
    end

    def fetch_file(dir, file)
      File.read(File.join(File.expand_path('..', __dir__), "#{dir}/#{file}"))
    end

    def get_build_path(dir)
      "#{get_project}/#{dir}"
    end

    def get_project
      file_path = File.read('system/sn-workspace.json')
      JSON.parse(file_path)['ACTIVE_APPLICATION']
    end

    def replace_content(item)
      File.write(item, File.open(item, &:read).gsub('@project', get_project))
    end
  end
end
