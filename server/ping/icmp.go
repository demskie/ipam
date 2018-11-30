package ping

import (
	"fmt"
	"net"
	"os"
	"time"

	"golang.org/x/net/icmp"
	"golang.org/x/net/ipv4"
	"golang.org/x/net/ipv6"
)

func pingICMPv4(addr net.IP, timeout int) (bool, error) {
	conn, err := icmp.ListenPacket("ip4:icmp", "0.0.0.0")
	if err != nil {
		return false, fmt.Errorf("icmp.ListenPacket() %v", err)
	}
	conn.SetDeadline(time.Now().Add(time.Duration(timeout) * time.Second))
	defer conn.Close()
	msg := icmp.Message{
		Type: ipv4.ICMPTypeEcho, Code: 0,
		Body: &icmp.Echo{
			ID: os.Getpid() & 0xffff, Seq: 1,
			Data: []byte("HELLO-R-U-THERE"),
		},
	}
	b, err := msg.Marshal(nil)
	if err != nil {
		return false, fmt.Errorf("msg.Marshal() %v", err)
	}
	destAddr := &net.IPAddr{
		IP: addr,
	}
	_, err = conn.WriteTo(b, destAddr)
	if err != nil {
		return false, fmt.Errorf("conn.WriteTo() %v", err)
	}
	rb := make([]byte, 1500)
	n, peer, err := conn.ReadFrom(rb)
	if err != nil {
		return false, fmt.Errorf("conn.ReadFrom() %v", err)
	}
	rmsg, err := icmp.ParseMessage(1, rb[:n])
	if err != nil {
		return false, fmt.Errorf("icmp.ParseMessage() %v", err)
	}
	switch rmsg.Type {
	case ipv4.ICMPTypeEchoReply:
		if peer.(*net.IPAddr).IP.Equal(addr) == false {
			return true, fmt.Errorf("received echo reply from %v instead of %v", peer, addr)
		}
	default:
		return false, fmt.Errorf("received %+v from %v; wanted echo reply", rmsg, peer)
	}
	return true, nil
}

func pingICMPv6(addr net.IP, timeout int) (bool, error) {
	conn, err := icmp.ListenPacket("ip6:ipv6-icmp", "::")
	if err != nil {
		return false, fmt.Errorf("icmp.ListenPacket() %v", err)
	}
	conn.SetDeadline(time.Now().Add(time.Duration(timeout) * time.Second))
	defer conn.Close()
	msg := icmp.Message{
		Type: ipv6.ICMPTypeEchoRequest, Code: 0,
		Body: &icmp.Echo{
			ID: os.Getpid() & 0xffff, Seq: 1,
			Data: []byte("HELLO-R-U-THERE"),
		},
	}
	b, err := msg.Marshal(nil)
	if err != nil {
		return false, fmt.Errorf("msg.Marshal() %v", err)
	}
	destAddr := &net.IPAddr{
		IP: addr,
	}
	_, err = conn.WriteTo(b, destAddr)
	if err != nil {
		return false, fmt.Errorf("conn.WriteTo() %v", err)
	}
	rb := make([]byte, 1500)
	n, peer, err := conn.ReadFrom(rb)
	if err != nil {
		return false, fmt.Errorf("conn.ReadFrom() %v", err)
	}
	rmsg, err := icmp.ParseMessage(58, rb[:n])
	if err != nil {
		return false, fmt.Errorf("icmp.ParseMessage() %v", err)
	}
	switch rmsg.Type {
	case ipv6.ICMPTypeEchoReply:
		if peer.(*net.IPAddr).IP.Equal(addr) == false {
			return true, fmt.Errorf("received echo reply from %v instead of %v", peer, addr)
		}
	default:
		return false, fmt.Errorf("received %+v from %v; wanted echo reply", rmsg, peer)
	}
	return true, nil
}

func pingUDPv4(addr net.IP, timeout int) error {
	conn, err := icmp.ListenPacket("udp4", "0.0.0.0")
	if err != nil {
		return fmt.Errorf("icmp.ListenPacket() %v", err)
	}
	conn.SetDeadline(time.Now().Add(time.Duration(timeout) * time.Second))
	defer conn.Close()
	msg := icmp.Message{
		Type: ipv4.ICMPTypeEcho, Code: 0,
		Body: &icmp.Echo{
			ID: os.Getpid() & 0xffff, Seq: 1,
			Data: []byte("HELLO-R-U-THERE"),
		},
	}
	b, err := msg.Marshal(nil)
	if err != nil {
		return fmt.Errorf("msg.Marshal() %v", err)
	}
	udpAddr := &net.UDPAddr{
		IP: addr,
	}
	_, err = conn.WriteTo(b, udpAddr)
	if err != nil {
		return fmt.Errorf("conn.WriteTo() %v", err)
	}
	rb := make([]byte, 1500)
	n, peer, err := conn.ReadFrom(rb)
	if err != nil {
		return fmt.Errorf("conn.ReadFrom() %v", err)
	}
	rmsg, err := icmp.ParseMessage(1, rb[:n])
	if err != nil {
		return fmt.Errorf("icmp.ParseMessage() %v", err)
	}
	switch rmsg.Type {
	case ipv6.ICMPTypeEchoReply:
		if peer.(*net.IPAddr).IP.Equal(addr) == false {
			return fmt.Errorf("received echo reply from %v instead of %v", peer, addr)
		}
	default:
		return fmt.Errorf("received %+v from %v; wanted echo reply", rmsg, peer)
	}
	return nil
}

func pingUDPv6(addr net.IP, timeout int) error {
	conn, err := icmp.ListenPacket("udp6", "fe80::1") // BUG "fe80::1%en0"
	if err != nil {
		return fmt.Errorf("icmp.ListenPacket() %v", err)
	}
	conn.SetDeadline(time.Now().Add(time.Duration(timeout) * time.Second))
	defer conn.Close()
	msg := icmp.Message{
		Type: ipv6.ICMPTypeEchoRequest, Code: 0,
		Body: &icmp.Echo{
			ID: os.Getpid() & 0xffff, Seq: 1,
			Data: []byte("HELLO-R-U-THERE"),
		},
	}
	b, err := msg.Marshal(nil)
	if err != nil {
		return fmt.Errorf("msg.Marshal() %v", err)
	}
	udpAddr := &net.UDPAddr{
		IP: addr,
		//Zone: "en0",
	}
	_, err = conn.WriteTo(b, udpAddr)
	if err != nil {
		return fmt.Errorf("conn.WriteTo() %v", err)
	}
	rb := make([]byte, 1500)
	n, peer, err := conn.ReadFrom(rb)
	if err != nil {
		return fmt.Errorf("conn.ReadFrom() %v", err)
	}
	rmsg, err := icmp.ParseMessage(58, rb[:n])
	if err != nil {
		return fmt.Errorf("icmp.ParseMessage() %v", err)
	}
	switch rmsg.Type {
	case ipv6.ICMPTypeEchoReply:
		if peer.(*net.IPAddr).IP.Equal(addr) == false {
			return fmt.Errorf("received echo reply from %v instead of %v", peer, addr)
		}
	default:
		return fmt.Errorf("received %+v from %v; wanted echo reply", rmsg, peer)
	}
	return nil
}
