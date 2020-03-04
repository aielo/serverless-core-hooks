# Vagrant setup
Vagrant.configure("2") do |config|
  # Box and providers
  config.vm.box = "hashicorp/bionic64"
  config.vm.provider "virtualbox" do |vb|
    vb.name = "serverless-core-hooks"
    vb.cpus = 2
    vb.memory = 4096
    # No ubuntu-(.*)-console.log in host
    vb.customize [ "modifyvm", :id, "--uartmode1", "disconnected"]
  end
  # Port forward
  ports = [ { :guest=> 9229, :host => 9229 } ]
  ports.each do |entry|
    config.vm.network "forwarded_port", guest: entry[:guest], host: entry[:host]
  end
  # Provision
  config.vm.provision "shell", path: "resources/vagrant/provision.sh"
end
