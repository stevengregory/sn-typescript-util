#!/usr/bin/env ruby

require 'json'

module ServiceNow
  class Utils
    def fetch_file(dir, file)
      File.read(File.join(File.expand_path('..', __dir__), "#{dir}/#{file}"))
    end

    def get_project_name
      file_path = File.read('system/sn-workspace.json')
      JSON.parse(file_path)['ACTIVE_APPLICATION']
    end

    def replace_content(item)
      File.write(item, File.open(item, &:read).gsub('@project', get_project_name))
    end
  end
end
