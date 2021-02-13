#!/usr/bin/env ruby

require_relative File.join(__dir__, 'build')

module ServiceNow
  ServiceNow::Build.new.start
end
