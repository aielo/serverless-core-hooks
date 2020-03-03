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
  config.vm.provision "shell", path: "resources/vagrant/provision.sh"
end
