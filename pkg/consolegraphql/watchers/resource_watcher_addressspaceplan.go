/*
 * Copyright 2019, EnMasse authors.
 * License: Apache License 2.0 (see the file LICENSE or http://apache.org/licenses/LICENSE-2.0.html).
 */

// Code generated by go generate; DO NOT EDIT.

package watchers

import (
	"fmt"
	tp "github.com/enmasseproject/enmasse/pkg/apis/admin/v1beta2"
	cp "github.com/enmasseproject/enmasse/pkg/client/clientset/versioned/typed/admin/v1beta2"
	"github.com/enmasseproject/enmasse/pkg/consolegraphql/cache"
	"k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/rest"
	"log"
	"reflect"
)

type AddressSpacePlanWatcher struct {
	Namespace string
	cache.Cache
	ClientInterface cp.AdminV1beta2Interface
	watching        chan struct{}
	watchingStarted bool
	stopchan        chan struct{}
	stoppedchan     chan struct{}
	create          func(*tp.AddressSpacePlan) interface{}
	update          func(*tp.AddressSpacePlan, interface{}) bool
}

func NewAddressSpacePlanWatcher(c cache.Cache, namespace string, options ...WatcherOption) (ResourceWatcher, error) {

	kw := &AddressSpacePlanWatcher{
		Namespace:   namespace,
		Cache:       c,
		watching:    make(chan struct{}),
		stopchan:    make(chan struct{}),
		stoppedchan: make(chan struct{}),
		create: func(v *tp.AddressSpacePlan) interface{} {
			return v
		},
		update: func(v *tp.AddressSpacePlan, e interface{}) bool {
			if !reflect.DeepEqual(v, e) {
				*e.(*tp.AddressSpacePlan) = *v
				return true
			} else {
				return false
			}
		},
	}

	for _, option := range options {
		option(kw)
	}

	if kw.ClientInterface == nil {
		return nil, fmt.Errorf("Client must be configured using the AddressSpacePlanWatcherConfig or AddressSpacePlanWatcherClient")
	}
	return kw, nil
}

func AddressSpacePlanWatcherFactory(create func(*tp.AddressSpacePlan) interface{}, update func(*tp.AddressSpacePlan, interface{}) bool) WatcherOption {
	return func(watcher ResourceWatcher) error {
		w := watcher.(*AddressSpacePlanWatcher)
		w.create = create
		w.update = update
		return nil
	}
}

func AddressSpacePlanWatcherConfig(config *rest.Config) WatcherOption {
	return func(watcher ResourceWatcher) error {
		w := watcher.(*AddressSpacePlanWatcher)

		var cl interface{}
		cl, _ = cp.NewForConfig(config)

		client, ok := cl.(cp.AdminV1beta2Interface)
		if !ok {
			return fmt.Errorf("unexpected type %T", cl)
		}

		w.ClientInterface = client
		return nil
	}
}

// Used to inject the fake client set for testing purposes
func AddressSpacePlanWatcherClient(client cp.AdminV1beta2Interface) WatcherOption {
	return func(watcher ResourceWatcher) error {
		w := watcher.(*AddressSpacePlanWatcher)
		w.ClientInterface = client
		return nil
	}
}

func (kw *AddressSpacePlanWatcher) Watch() error {
	go func() {
		defer close(kw.stoppedchan)
		defer func() {
			if !kw.watchingStarted {
				close(kw.watching)
			}
		}()
		resource := kw.ClientInterface.AddressSpacePlans(kw.Namespace)
		log.Printf("AddressSpacePlan - Watching")
		running := true
		for running {
			err := kw.doWatch(resource)
			if err != nil {
				log.Printf("AddressSpacePlan - Restarting watch")
			} else {
				running = false
			}
		}
		log.Printf("AddressSpacePlan - Watching stopped")
	}()

	return nil
}

func (kw *AddressSpacePlanWatcher) AwaitWatching() {
	<-kw.watching
}

func (kw *AddressSpacePlanWatcher) Shutdown() {
	close(kw.stopchan)
	<-kw.stoppedchan
}

func (kw *AddressSpacePlanWatcher) doWatch(resource cp.AddressSpacePlanInterface) error {
	resourceList, err := resource.List(v1.ListOptions{})
	if err != nil {
		return err
	}

	keyCreator, err := kw.Cache.GetKeyCreator(cache.PrimaryObjectIndex)
	if err != nil {
		return err
	}
	curr := make(map[string]interface{}, 0)
	_, err = kw.Cache.Get(cache.PrimaryObjectIndex, "AddressSpacePlan/", func(obj interface{}) (bool, bool, error) {
		gen, key, err := keyCreator(obj)
		if err != nil {
			return false, false, err
		} else if !gen {
			return false, false, fmt.Errorf("failed to generate key for existing object %+v", obj)
		}
		curr[key] = obj
		return false, true, nil
	})

	var added = 0
	var updated = 0
	var unchanged = 0
	for _, res := range resourceList.Items {
		copy := res.DeepCopy()
		kw.updateKind(copy)

		candidate := kw.create(copy)
		gen, key, err := keyCreator(candidate)
		if err != nil {
			return err
		} else if !gen {
			return fmt.Errorf("failed to generate key for new object %+v", copy)
		}
		if existing, ok := curr[key]; ok {
			err = kw.Cache.Update(func(current interface{}) (interface{}, error) {
				if kw.update(copy, current) {
					updated++
					return copy, nil
				} else {
					unchanged++
					return nil, nil
				}
			}, existing)
			if err != nil {
				return err
			}
			delete(curr, key)
		} else {
			err = kw.Cache.Add(candidate)
			if err != nil {
				return err
			}
			added++
		}
	}

	// Now remove any stale
	for _, stale := range curr {
		err = kw.Cache.Delete(stale)
		if err != nil {
			return err
		}
	}
	var stale = len(curr)

	log.Printf("AddressSpacePlan - Cache initialised population added %d, updated %d, unchanged %d, stale %d", added, updated, unchanged, stale)
	resourceWatch, err := resource.Watch(v1.ListOptions{
		ResourceVersion: resourceList.ResourceVersion,
	})

	if !kw.watchingStarted {
		close(kw.watching)
		kw.watchingStarted = true
	}

	ch := resourceWatch.ResultChan()
	for {
		select {
		case event := <-ch:
			var err error
			if event.Type == watch.Error {
				err = fmt.Errorf("Watch ended in error")
			} else {
				res, ok := event.Object.(*tp.AddressSpacePlan)
				log.Printf("AddressSpacePlan - Received event type %s", event.Type)
				if !ok {
					err = fmt.Errorf("Watch error - object of unexpected type received")
				} else {
					copy := res.DeepCopy()
					kw.updateKind(copy)
					switch event.Type {
					case watch.Added:
						err = kw.Cache.Add(kw.create(copy))
					case watch.Modified:
						updatingKey := kw.create(copy)
						err = kw.Cache.Update(func(current interface{}) (interface{}, error) {
							if kw.update(copy, current) {
								return copy, nil
							} else {
								return nil, nil
							}
						}, updatingKey)
					case watch.Deleted:
						err = kw.Cache.Delete(kw.create(copy))
					}
				}
			}
			if err != nil {
				return err
			}
		case <-kw.stopchan:
			log.Printf("AddressSpacePlan - Shutdown received")
			return nil
		}
	}
}

func (kw *AddressSpacePlanWatcher) updateKind(o *tp.AddressSpacePlan) {
	if o.TypeMeta.Kind == "" {
		o.TypeMeta.Kind = "AddressSpacePlan"
	}
}
